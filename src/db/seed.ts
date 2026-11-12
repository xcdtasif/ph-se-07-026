import { env } from "../config/env.js"
import { prisma } from "../lib/prisma.js"
import { seedAdmin } from "./seeders/admin.js"
import { seedCategories } from "./seeders/categories.js"
import { seedLandlords } from "./seeders/landlords.js"
import { seedProperties } from "./seeders/properties.js"
import { seedRequests } from "./seeders/requests.js"
import { seedTenants } from "./seeders/tenants.js"

const isProduction = env.NODE_ENV === "production"

try {
  if (!isProduction) {
    await seedLandlords()
    await seedTenants()
  }

  await seedAdmin()
  await seedCategories()

  if (!isProduction) {
    await seedProperties()
    await seedRequests()
  } else {
    console.log("Production: skipped landlords, tenants, properties and requests")
  }
} catch (error) {
  console.error("Seeding failed:", error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
