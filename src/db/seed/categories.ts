import { prisma } from "../../lib/prisma.js"

const CATEGORY_NAMES = ["Apartment", "House", "Studio", "Commercial"]

export const seedCategories = async () => {
  const existing = await prisma.category.findMany({ select: { name: true } })
  const existingNames = new Set(existing.map((category) => category.name.toLowerCase()))

  const missing = CATEGORY_NAMES.filter((name) => !existingNames.has(name.toLowerCase()))

  if (missing.length === 0) {
    console.log("Categories already exist, skipping")
    return
  }

  await prisma.category.createMany({ data: missing.map((name) => ({ name })) })

  console.log(`Categories created: ${missing.join(", ")}`)
}
