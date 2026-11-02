import httpStatus from "http-status"

import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"
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

  return user
}

export const authService = {
  registerUser,
}
