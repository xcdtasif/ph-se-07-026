import type { RequestHandler } from "express"
import httpStatus from "http-status"

import { env } from "../config/env.js"
import { prisma } from "../lib/prisma.js"
import { AppError } from "../utils/app-error.js"
import { jwtUtils } from "../utils/jwt.js"

export const authenticate: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies?.["accessToken"]

  if (typeof token !== "string" || token === "") {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required")
  }

  const { userId } = jwtUtils.verifyToken(token, env.JWT_ACCESS_SECRET)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true },
  })

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User no longer exists")
  }

  if (user.isBanned) {
    throw new AppError(httpStatus.FORBIDDEN, "Your account has been banned")
  }

  req.user = user

  next()
}
