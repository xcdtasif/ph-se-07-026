import httpStatus from "http-status"

import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"
import type { LoginUserPayload, RegisterUserPayload } from "./auth.schema.js"
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

  const { accessToken, refreshToken } = authUtils.generateTokens(user)

  return { user, accessToken, refreshToken }
}

const loginUser = async (payload: LoginUserPayload) => {
  const { email, password } = payload

  const user = await prisma.user.findUnique({ where: { email } })

  const isPasswordValid = await authUtils.comparePassword(
    password,
    user?.password ?? authUtils.DUMMY_HASH,
  )

  if (!user || !isPasswordValid) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password")
  }

  if (user.isBanned) {
    throw new AppError(httpStatus.FORBIDDEN, "Your account has been banned")
  }

  const { accessToken, refreshToken } = authUtils.generateTokens(user)
  const { password: _password, ...safeUser } = user

  return { user: safeUser, accessToken, refreshToken }
}

const refreshTokens = async (token: string) => {
  const { userId } = authUtils.verifyRefreshToken(token)

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

  const { accessToken, refreshToken } = authUtils.generateTokens(user)

  return { user, accessToken, refreshToken }
}

export const authService = {
  registerUser,
  loginUser,
  refreshTokens,
}
