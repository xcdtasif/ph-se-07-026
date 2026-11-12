import { prisma } from "../../lib/prisma.js"
import { authUtils } from "../../modules/auth/auth.utils.js"
import { logCount } from "./log-count.js"

const SEED_PASSWORD = "1a2s3d4f"

type SeedUser = { name: string; email: string; isBanned?: boolean }

export const seedUsersWithRole = async (
  users: SeedUser[],
  role: "LANDLORD" | "TENANT",
  singular: string,
  plural: string,
) => {
  const existing = await prisma.user.findMany({
    where: { email: { in: users.map((user) => user.email) } },
    select: { email: true },
  })
  const existingEmails = new Set(existing.map((user) => user.email))

  const missing = users.filter((user) => !existingEmails.has(user.email))

  if (missing.length === 0) {
    logCount(0, singular, plural, "created")
    return
  }

  const password = await authUtils.hashPassword(SEED_PASSWORD)

  await prisma.user.createMany({ data: missing.map((user) => ({ ...user, password, role })) })

  logCount(missing.length, singular, plural, "created")
}
