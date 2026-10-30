import { PrismaNeon } from "@prisma/adapter-neon"

import { env } from "../config/env.js"
import { PrismaClient } from "../generated/prisma/index.js"

const adapter = new PrismaNeon({
  connectionString: env.databaseUrl,
})

export const prisma = new PrismaClient({ adapter })
