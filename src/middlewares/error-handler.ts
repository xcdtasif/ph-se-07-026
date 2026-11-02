import type { ErrorRequestHandler } from "express"
import httpStatus from "http-status"

import { Prisma } from "../generated/prisma/client.js"
import { AppError } from "../utils/app-error.js"
import { sendResponse } from "../utils/send-response.js"

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err)

    return
  }

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR
  let message = "Internal server error"
  let errors: unknown

  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    errors = err.errors
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = httpStatus.CONFLICT
      message = "Resource already exists"
    } else if (err.code === "P2025") {
      statusCode = httpStatus.NOT_FOUND
      message = "Resource not found"
    }
  }

  if (statusCode === httpStatus.INTERNAL_SERVER_ERROR) {
    console.error(err)
  }

  sendResponse(res, { success: false, statusCode, message, errors })
}
