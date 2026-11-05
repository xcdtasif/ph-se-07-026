import { prisma } from "../../lib/prisma.js"
import { loginUserSchema } from "../../modules/auth/auth.schema.js"
import { authUtils } from "../../modules/auth/auth.utils.js"

export const seedAdmin = async () => {
  const name = process.env["ADMIN_NAME"] || "Admin"
  const { email, password } = loginUserSchema.parse({
    email: process.env["ADMIN_EMAIL"],
    password: process.env["ADMIN_PASSWORD"],
  })

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    if (existing.role !== "ADMIN") {
      throw new Error(`A non-admin user with email ${email} already exists`)
    }

    console.log(`Admin ${email} already exists, skipping`)
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

  console.log(`Admin ${email} created`)
}
