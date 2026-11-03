import httpStatus from "http-status"

import { env } from "../../config/env.js"
import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"
import { jwtUtils } from "../../utils/jwt.js"
import type { RegisterUserPayload } from "./auth.schema.js"
import { authUtils } from "./auth.utils.js"

const registerUser = async (payload: RegisterUserPayload) => {
  const { name, email, password, role } = payload

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, "User already exists")
  }

  const hashedPassword = await authUtils.hashPassword(password)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
    omit: {
      password: true,
    },
  })

  const accessToken = jwtUtils.createToken(
    { userId: user.id, role: user.role },
    env.JWT_ACCESS_SECRET,
    env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  )

  const refreshToken = jwtUtils.createToken(
    { userId: user.id, role: user.role },
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  )

  return { user, accessToken, refreshToken }
}

export const authService = {
  registerUser,
}
