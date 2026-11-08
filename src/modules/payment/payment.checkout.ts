import type { Prisma } from "../../generated/prisma/client.js"

// Stripe needs a Checkout session to live at least 30 minutes
export const CHECKOUT_EXPIRES_IN_SECONDS = 35 * 60

/*
A PENDING payment younger than a session's lifetime has a checkout that may still be paid.
Using its age instead of its status alone keeps a missed "expired" webhook from locking the
request forever.
*/
export const activeCheckoutWhere = (requestId: string): Prisma.PaymentWhereInput => ({
  requestId,
  status: "PENDING",
  createdAt: { gt: new Date(Date.now() - CHECKOUT_EXPIRES_IN_SECONDS * 1000) },
})
