import { prisma } from "../../lib/prisma.js"
import { seedAdmin } from "./admin.js"
import { seedCategories } from "./categories.js"

try {
  await seedAdmin()
  await seedCategories()
} catch (error) {
  console.error("Seeding failed:", error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
