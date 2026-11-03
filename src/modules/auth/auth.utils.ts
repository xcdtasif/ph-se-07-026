import bcrypt from "bcryptjs"

import { env } from "../../config/env.js"

const BCRYPT_SALT_ROUNDS = env.BCRYPT_SALT_ROUNDS || 10

const hashPassword = (password: string) => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

const comparePassword = (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword)
}

export const authUtils = {
  hashPassword,
  comparePassword,
}
