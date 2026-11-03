import type { ErrorRequestHandler } from "express"
import httpStatus from "http-status"

import { AppError } from "../utils/app-error.js"
import { handlePrismaError } from "../utils/handle-prisma-error.js"
import { sendResponse } from "../utils/send-response.js"

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err)

    return
  }

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR
  let message = "Internal server error"
  let errorDetails: unknown

  const prismaError = handlePrismaError(err)

  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    errorDetails = err.errorDetails
  } else if (prismaError) {
    statusCode = prismaError.statusCode
    message = prismaError.message
    errorDetails = prismaError.errorDetails
  }

  if (statusCode >= httpStatus.INTERNAL_SERVER_ERROR) {
    console.error(err)
  }

  sendResponse(res, { success: false, statusCode, message, errorDetails })
}
