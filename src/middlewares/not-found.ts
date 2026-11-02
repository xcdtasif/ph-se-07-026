import type { RequestHandler } from "express"
import httpStatus from "http-status"

import { AppError } from "../utils/app-error.js"

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(httpStatus.NOT_FOUND, `Route ${req.method} ${req.originalUrl} not found`))
}
