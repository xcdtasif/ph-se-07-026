import type { RequestStatus } from "../../generated/prisma/enums.js"
import { prisma } from "../../lib/prisma.js"
import { logCount } from "../utils/log-count.js"
import { TENANTS } from "./tenants.js"

type SeedRequest = {
  tenant: string
  property: string
  status: RequestStatus
  message: string
  review?: { rating: number; comment: string; isHidden?: boolean }
}

/*
One request per status the flow can show, plus completed rentals with reviews. The tenants are
TENANTS[0] to TENANTS[2] and the properties are the ones in properties.ts.
*/
const REQUESTS: SeedRequest[] = [
  {
    tenant: "tenant01@gmail.com",
    property: "Sunny 2-Bed Apartment in Dhanmondi",
    status: "COMPLETED",
    message: "We rented this flat for a year and moved out on good terms.",
    review: { rating: 5, comment: "Quiet building and a very responsive landlord." },
  },
  {
    tenant: "tenant02@gmail.com",
    property: "Sunny 2-Bed Apartment in Dhanmondi",
    status: "COMPLETED",
    message: "A short stay while our own flat was being renovated.",
    review: {
      rating: 2,
      comment: "Awful experience, the landlord never answered a single message.",
      isHidden: true,
    },
  },
  {
    tenant: "tenant01@gmail.com",
    property: "Modern 3-Bed Apartment in Gulshan",
    status: "COMPLETED",
    message: "Rented for two years for my family.",
    review: { rating: 4, comment: "Spacious and well kept, the generator backup is a big plus." },
  },
  // Approved, so the property is RESERVED and the tenant can start the payment flow
  {
    tenant: "tenant01@gmail.com",
    property: "Cozy Duplex in Bashundhara",
    status: "APPROVED",
    message: "I would like to move in with my family next month.",
  },
  {
    tenant: "tenant03@gmail.com",
    property: "Family House with Garden in Uttara",
    status: "PENDING",
    message: "Looking for a quiet house for my family, can we visit this week?",
  },
  {
    tenant: "tenant02@gmail.com",
    property: "Family House with Garden in Uttara",
    status: "CANCELLED",
    message: "Interested in a long lease, but I found another place.",
  },
  {
    tenant: "tenant03@gmail.com",
    property: "Compact Studio near Banani Lake",
    status: "REJECTED",
    message: "I would like to rent this studio from next month.",
  },
]

export const seedRequests = async () => {
  const tenants = await prisma.user.findMany({
    where: { email: { in: TENANTS.map(({ email }) => email) }, role: "TENANT" },
    select: { id: true, email: true },
  })
  const tenantIds = new Map(tenants.map(({ id, email }) => [email, id]))

  const completed = REQUESTS.filter(({ status }) => status === "COMPLETED").length
  const reviewed = REQUESTS.filter(({ review }) => review).length

  const existing = await prisma.request.count({
    where: { tenantId: { in: [...tenantIds.values()] } },
  })

  if (existing > 0) {
    logCount(0, "request", "requests", "created")
    logCount(0, "payment", "payments", "created")
    logCount(0, "review", "reviews", "created")
    return
  }

  const properties = await prisma.property.findMany({
    where: { name: { in: REQUESTS.map(({ property }) => property) } },
  })
  const propertiesByName = new Map(properties.map((property) => [property.name, property]))

  await prisma.$transaction(async (tx) => {
    for (const [index, seedRequest] of REQUESTS.entries()) {
      const tenantId = tenantIds.get(seedRequest.tenant)
      const property = propertiesByName.get(seedRequest.property)

      if (!tenantId) {
        throw new Error(`Seed tenant ${seedRequest.tenant} not found, seed users first`)
      }

      if (!property) {
        throw new Error(`Seed property ${seedRequest.property} not found, seed properties first`)
      }

      const request = await tx.request.create({
        data: {
          tenantId,
          propertyId: property.id,
          message: seedRequest.message,
          status: seedRequest.status,
        },
      })

      // There is no Stripe session behind these payments, they only show a paid deposit
      if (seedRequest.status === "COMPLETED") {
        await tx.payment.create({
          data: {
            requestId: request.id,
            stripeSessionId: `cs_test_seed_${index + 1}`,
            amount: property.deposit,
            status: "COMPLETED",
          },
        })
      }

      if (seedRequest.review) {
        await tx.review.create({
          data: {
            tenantId,
            propertyId: property.id,
            requestId: request.id,
            ...seedRequest.review,
          },
        })
      }

      if (seedRequest.status === "APPROVED") {
        await tx.property.update({ where: { id: property.id }, data: { status: "RESERVED" } })
      }
    }
  })

  logCount(REQUESTS.length, "request", "requests", "created")
  logCount(completed, "payment", "payments", "created")
  logCount(reviewed, "review", "reviews", "created")
}
