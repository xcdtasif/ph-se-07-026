import bcrypt from "bcryptjs"

import { env } from "../../config/env.js"
import type { UserRole } from "../../generated/prisma/enums.js"
import { jwtUtils } from "../../utils/jwt.js"

const BCRYPT_SALT_ROUNDS = env.BCRYPT_SALT_ROUNDS || 10

const DUMMY_HASH = bcrypt.hashSync("dummy-password", env.BCRYPT_SALT_ROUNDS)

const hashPassword = (password: string) => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

const comparePassword = (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword)
}

const generateTokens = (user: { id: string; role: UserRole }) => {
  const payload = { userId: user.id, role: user.role }

  const accessToken = jwtUtils.createToken(
    payload,
    env.JWT_ACCESS_SECRET,
    env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  )
  const refreshToken = jwtUtils.createToken(
    payload,
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  )

  return { accessToken, refreshToken }
}

const verifyAccessToken = (token: string) => {
  return jwtUtils.verifyToken(token, env.JWT_ACCESS_SECRET)
}

const verifyRefreshToken = (token: string) => {
  return jwtUtils.verifyToken(token, env.JWT_REFRESH_SECRET)
}

export const authUtils = {
  DUMMY_HASH,
  hashPassword,
  comparePassword,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
}
