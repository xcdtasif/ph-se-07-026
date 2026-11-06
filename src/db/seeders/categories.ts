import { prisma } from "../../lib/prisma.js"
import { logCount } from "../utils/log-count.js"

const CATEGORY_NAMES = ["Apartment", "House", "Studio", "Commercial"]

export const seedCategories = async () => {
  const existing = await prisma.category.findMany({ select: { name: true } })
  const existingNames = new Set(existing.map((category) => category.name.toLowerCase()))

  const missing = CATEGORY_NAMES.filter((name) => !existingNames.has(name.toLowerCase()))

  if (missing.length === 0) {
    logCount(0, "category", "categories", "created")
    return
  }

  await prisma.category.createMany({ data: missing.map((name) => ({ name })) })

  logCount(missing.length, "category", "categories", "created")
}
