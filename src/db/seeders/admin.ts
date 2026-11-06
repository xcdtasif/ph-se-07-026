import { prisma } from "../../lib/prisma.js"
import { loginUserSchema } from "../../modules/auth/auth.schema.js"
import { authUtils } from "../../modules/auth/auth.utils.js"
import { logCount } from "../utils/log-count.js"

export const seedAdmin = async () => {
  const name = process.env["ADMIN_NAME"] || "Admin 01"
  const { email, password } = loginUserSchema.parse({
    email: process.env["ADMIN_EMAIL"],
    password: process.env["ADMIN_PASSWORD"],
  })

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    if (existing.role !== "ADMIN") {
      throw new Error(`A non-admin user with email ${email} already exists`)
    }

    logCount(0, "admin", "admins", "created")
    return
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password: await authUtils.hashPassword(password),
      role: "ADMIN",
    },
  })

  logCount(1, "admin", "admins", "created")
}
