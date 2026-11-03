import type { RequestHandler } from "express"
import httpStatus from "http-status"

import type { UserRole } from "../generated/prisma/enums.js"
import { AppError } from "../utils/app-error.js"

export const authorize =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required")
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(httpStatus.FORBIDDEN, "You don't have permission to do this")
    }

    next()
  }
