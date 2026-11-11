import { prisma } from "../../lib/prisma.js"
import { PLACEHOLDER_IMAGE_URL } from "../../modules/upload/upload.constants.js"
import { logCount } from "../utils/log-count.js"
import { LANDLORDS } from "./landlords.js"

type SeedProperty = {
  category: string
  name: string
  description: string
  location: string
  rent: number
  deposit: number
}

const PROPERTIES: SeedProperty[] = [
  {
    category: "Apartment",
    name: "Sunny 2-Bed Apartment in Dhanmondi",
    description:
      "Bright two-bedroom apartment with a balcony, close to the lake and public transport.",
    location: "Dhanmondi, Dhaka",
    rent: 28000,
    deposit: 56000,
  },
  {
    category: "Apartment",
    name: "Modern 3-Bed Apartment in Gulshan",
    description:
      "Spacious three-bedroom apartment with a lift, generator backup and covered parking.",
    location: "Gulshan 2, Dhaka",
    rent: 55000,
    deposit: 110000,
  },
  {
    category: "House",
    name: "Family House with Garden in Uttara",
    description: "Detached four-bedroom house with a private garden, garage and a quiet street.",
    location: "Uttara Sector 7, Dhaka",
    rent: 70000,
    deposit: 140000,
  },
  {
    category: "House",
    name: "Cozy Duplex in Bashundhara",
    description: "Two-storey duplex with three bedrooms, a rooftop terrace and 24/7 security.",
    location: "Bashundhara R/A, Dhaka",
    rent: 48000,
    deposit: 96000,
  },
  {
    category: "Studio",
    name: "Compact Studio near Banani Lake",
    description:
      "Fully furnished studio with a kitchenette and fast internet, ideal for one person.",
    location: "Banani, Dhaka",
    rent: 16000,
    deposit: 32000,
  },
  {
    category: "Studio",
    name: "Furnished Studio in Mirpur DOHS",
    description: "Neat studio flat with an attached bath, close to the metro and local markets.",
    location: "Mirpur DOHS, Dhaka",
    rent: 13000,
    deposit: 26000,
  },
  {
    category: "Commercial",
    name: "Street-Facing Shop in Motijheel",
    description:
      "Ground-floor retail space with high foot traffic, a glass front and storage room.",
    location: "Motijheel, Dhaka",
    rent: 90000,
    deposit: 270000,
  },
  {
    category: "Commercial",
    name: "Open-Plan Office in Karwan Bazar",
    description: "Air-conditioned office floor with meeting room, reception area and parking.",
    location: "Karwan Bazar, Dhaka",
    rent: 65000,
    deposit: 195000,
  },
]

export const seedProperties = async () => {
  const landlords = await prisma.user.findMany({
    where: { email: { in: LANDLORDS.map((landlord) => landlord.email) }, role: "LANDLORD" },
    orderBy: { email: "asc" },
  })

  if (landlords.length !== LANDLORDS.length) {
    throw new Error("Seed landlords not found, seed users first")
  }

  const categories = await prisma.category.findMany()
  const categoryIds = new Map(categories.map((category) => [category.name, category.id]))

  const existing = await prisma.property.findMany({
    where: { landlordId: { in: landlords.map((landlord) => landlord.id) } },
    select: { name: true },
  })
  const existingNames = new Set(existing.map((property) => property.name))

  const missing = PROPERTIES.filter((property) => !existingNames.has(property.name))

  if (missing.length === 0) {
    logCount(0, "property", "properties", "created")
    return
  }

  await prisma.property.createMany({
    data: missing.map(({ category, ...property }, index) => {
      const categoryId = categoryIds.get(category)

      if (!categoryId) {
        throw new Error(`Category ${category} not found, seed categories first`)
      }

      return {
        ...property,
        landlordId: landlords[index % landlords.length]!.id,
        categoryId,
        images: [PLACEHOLDER_IMAGE_URL],
      }
    }),
  })

  logCount(missing.length, "property", "properties", "created")
}
