import { env } from "../config/env.js"
import { prisma } from "../lib/prisma.js"
import { logCount } from "./utils/log-count.js"

const deleteAll = async () => {
  if (env.NODE_ENV === "production") {
    throw new Error("Refusing to delete data when NODE_ENV is production")
  }

  // Order follows the foreign keys: children are deleted before their parents.
  // Not run in a transaction: deleting is safe to repeat if it fails halfway.
  const reviews = await prisma.review.deleteMany()
  logCount(reviews.count, "review", "reviews", "deleted")

  const payments = await prisma.payment.deleteMany()
  logCount(payments.count, "payment", "payments", "deleted")

  const requests = await prisma.request.deleteMany()
  logCount(requests.count, "request", "requests", "deleted")

  const properties = await prisma.property.deleteMany()
  logCount(properties.count, "property", "properties", "deleted")

  const categories = await prisma.category.deleteMany()
  logCount(categories.count, "category", "categories", "deleted")

  const users = await prisma.user.deleteMany()
  logCount(users.count, "user", "users", "deleted")
}

try {
  await deleteAll()
} catch (error) {
  console.error("Deleting data failed:", error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
