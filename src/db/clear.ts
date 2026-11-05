import { env } from "../config/env.js"
import { prisma } from "../lib/prisma.js"

const clearAll = async () => {
  if (env.NODE_ENV === "production") {
    throw new Error("Refusing to clear data when NODE_ENV is production")
  }

  const [payments, reviews, requests, properties, categories, users] = await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.review.deleteMany(),
    prisma.request.deleteMany(),
    prisma.property.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ])

  console.log(
    `Deleted ${payments.count} payments, ${reviews.count} reviews, ${requests.count} requests, ` +
      `${properties.count} properties, ${categories.count} categories, ${users.count} users`,
  )
}

try {
  await clearAll()
} catch (error) {
  console.error("Clearing data failed:", error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
