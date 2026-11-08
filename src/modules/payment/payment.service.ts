import httpStatus from "http-status"

import { env } from "../../config/env.js"
import type { Prisma } from "../../generated/prisma/client.js"
import { prisma } from "../../lib/prisma.js"
import { stripe } from "../../lib/stripe.js"
import { AppError } from "../../utils/app-error.js"
import { CHECKOUT_EXPIRES_IN_SECONDS, activeCheckoutWhere } from "./payment.checkout.js"
import type { CreatePaymentPayload, PaymentListQuery } from "./payment.schema.js"

const CURRENCY = "bdt"

const paymentInclude = {
  request: {
    select: {
      id: true,
      tenantId: true,
      status: true,
      property: { select: { id: true, name: true, location: true } },
    },
  },
} satisfies Prisma.PaymentInclude

// The tenant pays the property's deposit once the landlord approves the request
const createPayment = async (
  tenant: { id: string; email: string },
  { requestId }: CreatePaymentPayload,
) => {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { property: { select: { name: true, deposit: true } } },
  })

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, "Request not found")
  }

  if (request.tenantId !== tenant.id) {
    throw new AppError(httpStatus.FORBIDDEN, "This request isn't yours")
  }

  const { name, deposit } = request.property

  // Sessions created inside the transaction, so they can be expired if it fails
  const createdSessionIds: string[] = []

  try {
    return await prisma.$transaction(
      async (tx) => {
        /*
        Writing the request locks its row until commit. A second create (a double click) waits
        here and then reuses the checkout below, and a landlord reject waits and then sees the
        payment. If the request is no longer approved, nothing is updated.
        */
        const { count } = await tx.request.updateMany({
          where: { id: request.id, status: "APPROVED" },
          data: { status: "APPROVED" },
        })

        if (count === 0) {
          throw new AppError(httpStatus.CONFLICT, "Only an approved request can be paid")
        }

        // Reuse the open checkout so a tenant who closed the tab has only one payable session
        const activePayment = await tx.payment.findFirst({
          where: activeCheckoutWhere(request.id),
          include: paymentInclude,
          orderBy: { createdAt: "desc" },
        })

        if (activePayment) {
          const activeSession = await stripe.checkout.sessions.retrieve(
            activePayment.stripeSessionId,
          )

          if (activeSession.status === "open" && activeSession.url) {
            return { ...activePayment, checkoutUrl: activeSession.url }
          }

          /*
          Paid, but the webhook has not activated the request yet. A new session would be
          payable too.
          */
          if (activeSession.status === "complete") {
            throw new AppError(httpStatus.CONFLICT, "Your payment is being processed")
          }
        }

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: CURRENCY,
                unit_amount: deposit.mul(100).round().toNumber(),
                product: env.STRIPE_PRODUCT_ID,
              },
            },
          ],
          customer_email: tenant.email,
          custom_text: { submit: { message: `Deposit for ${name}` } },
          payment_intent_data: { description: `Deposit for ${name}` },
          client_reference_id: request.id,
          metadata: { requestId: request.id },
          expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRES_IN_SECONDS,
          success_url: `${env.CLIENT_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${env.CLIENT_URL}/payments/cancel`,
        })

        createdSessionIds.push(session.id)

        if (!session.url) {
          throw new AppError(httpStatus.BAD_GATEWAY, "Could not create a checkout session")
        }

        const payment = await tx.payment.create({
          data: { requestId: request.id, stripeSessionId: session.id, amount: deposit },
          include: paymentInclude,
        })

        return { ...payment, checkoutUrl: session.url }
      },
      // Covers the Stripe calls made while the request row is locked
      { timeout: 30_000 },
    )
  } catch (error) {
    // Nobody should be able to pay a session that has no payment behind it
    await Promise.all(
      createdSessionIds.map((id) => stripe.checkout.sessions.expire(id).catch(() => undefined)),
    )

    throw error
  }
}

/*
Marks the payment COMPLETED and activates the request, rents the property, and rejects the
other pending requests for it. Stripe retries webhooks, so a payment that is no longer
PENDING is skipped.
*/
const completePayment = async (stripeSessionId: string) => {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { stripeSessionId },
      include: { request: { select: { id: true, propertyId: true } } },
    })

    if (!payment) {
      return
    }

    const { count } = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "COMPLETED" },
    })

    if (count === 0) {
      return
    }

    const { id: requestId, propertyId } = payment.request

    const { count: requestCount } = await tx.request.updateMany({
      where: { id: requestId, status: "APPROVED" },
      data: { status: "ACTIVE" },
    })

    if (requestCount === 0) {
      // The landlord rejected the request after the tenant opened the checkout page
      console.error(`Payment ${payment.id} was paid but request ${requestId} is no longer APPROVED`)

      return
    }

    await tx.property.updateMany({
      where: { id: propertyId, status: "RESERVED" },
      data: { status: "RENTED" },
    })

    await tx.request.updateMany({
      where: { propertyId, status: "PENDING" },
      data: { status: "REJECTED" },
    })
  })
}

/*
An unpaid checkout releases the property: the payment fails, the request is rejected, and the
property becomes available again.
*/
const failPayment = async (stripeSessionId: string) => {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { stripeSessionId },
      include: { request: { select: { id: true, propertyId: true } } },
    })

    if (!payment) {
      return
    }

    const { count } = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "FAILED" },
    })

    if (count === 0) {
      return
    }

    const { id: requestId, propertyId } = payment.request

    // A late webhook for an old session must not reject a request that has a newer checkout
    const newerCheckout = await tx.payment.count({ where: activeCheckoutWhere(requestId) })

    if (newerCheckout > 0) {
      return
    }

    const { count: requestCount } = await tx.request.updateMany({
      where: { id: requestId, status: "APPROVED" },
      data: { status: "REJECTED" },
    })

    if (requestCount === 0) {
      return
    }

    await tx.property.updateMany({
      where: { id: propertyId, status: "RESERVED" },
      data: { status: "AVAILABLE" },
    })
  })
}

const handleWebhook = async (rawBody: Buffer, signature: string) => {
  // Throws a signature error, which the error handler turns into a 400
  const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)

  if (event.type === "checkout.session.completed") {
    if (event.data.object.payment_status === "paid") {
      await completePayment(event.data.object.id)
    }
  } else if (event.type === "checkout.session.expired") {
    await failPayment(event.data.object.id)
  }
}

const getTenantPayments = async (tenantId: string, query: PaymentListQuery) => {
  const where: Prisma.PaymentWhereInput = {
    request: { tenantId },
    ...(query.status ? { status: query.status } : {}),
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: paymentInclude,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.payment.count({ where }),
  ])

  return { payments, meta: { page: query.page, limit: query.limit, total } }
}

const getTenantPaymentById = async (id: string, tenantId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: paymentInclude,
  })

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found")
  }

  if (payment.request.tenantId !== tenantId) {
    throw new AppError(httpStatus.FORBIDDEN, "This payment isn't yours")
  }

  return payment
}

export const paymentService = {
  createPayment,
  handleWebhook,
  getTenantPayments,
  getTenantPaymentById,
}
