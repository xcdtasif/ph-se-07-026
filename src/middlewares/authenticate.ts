import type { RequestHandler } from "express"
import httpStatus from "http-status"

import { prisma } from "../lib/prisma.js"
import { authUtils } from "../modules/auth/auth.utils.js"
import { AppError } from "../utils/app-error.js"

export const authenticate: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies?.["accessToken"]

  if (typeof token !== "string" || token === "") {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required")
  }

  const { userId } = authUtils.verifyAccessToken(token)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true },
  })

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Account not found, please log in again")
  }

  if (user.isBanned) {
    throw new AppError(httpStatus.FORBIDDEN, "Your account has been banned")
  }

  req.user = user

  next()
}
