import type { Request, Response } from "express"
import httpStatus from "http-status"

import { AppError } from "../../utils/app-error.js"
import { sendResponse } from "../../utils/send-response.js"
import type { CreatePaymentPayload, PaymentIdParams, PaymentListQuery } from "./payment.schema.js"
import { paymentService } from "./payment.service.js"

const getUser = (req: Request<any, any, any, any>) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required")
  }

  return req.user
}

const getUserId = (req: Request<any, any, any, any>) => getUser(req).id

const createPayment = async (req: Request<{}, {}, CreatePaymentPayload>, res: Response) => {
  const payment = await paymentService.createPayment(getUser(req), req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Payment created successfully",
    data: payment,
  })
}

const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"]

  if (typeof signature !== "string" || !Buffer.isBuffer(req.body)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid webhook request")
  }

  await paymentService.handleWebhook(req.body, signature)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Webhook processed successfully",
  })
}

const getTenantPayments = async (req: Request, res: Response) => {
  const { payments, meta } = await paymentService.getTenantPayments(
    getUserId(req),
    req.query as unknown as PaymentListQuery,
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payments fetched successfully",
    data: payments,
    meta,
  })
}

const getTenantPaymentById = async (req: Request<PaymentIdParams>, res: Response) => {
  const payment = await paymentService.getTenantPaymentById(req.params.id, getUserId(req))

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment fetched successfully",
    data: payment,
  })
}

export const paymentController = {
  createPayment,
  handleWebhook,
  getTenantPayments,
  getTenantPaymentById,
}
