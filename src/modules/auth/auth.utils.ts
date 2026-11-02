import bcrypt from "bcryptjs"

import { env } from "../../config/env.js"

const hashPassword = (password: string) => {
  return bcrypt.hash(password, env.bcryptSaltRounds)
}

const comparePassword = (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword)
}

export const authUtils = {
  hashPassword,
  comparePassword,
}
