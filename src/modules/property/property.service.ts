import httpStatus from "http-status"

import type { Prisma } from "../../generated/prisma/client.js"
import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"
import type {
  CreatePropertyPayload,
  PropertyListQuery,
  UpdatePropertyPayload,
} from "./property.schema.js"
const propertyInclude = {
  category: true,
  landlord: { select: { id: true, name: true } },
} satisfies Prisma.PropertyInclude

const orderByMap: Record<PropertyListQuery["sort"], Prisma.PropertyOrderByWithRelationInput> = {
  NEWEST: { createdAt: "desc" },
  RENT_ASC: { rent: "asc" },
  RENT_DESC: { rent: "desc" },
}

const getAllProperties = async (query: PropertyListQuery) => {
  const { page, limit, search, categoryId, minRent, maxRent, sort } = query

  const where: Prisma.PropertyWhereInput = {
    status: "AVAILABLE",
    ...(categoryId ? { categoryId } : {}),
    ...(minRent !== undefined || maxRent !== undefined
      ? {
          rent: {
            ...(minRent !== undefined ? { gte: minRent } : {}),
            ...(maxRent !== undefined ? { lte: maxRent } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: propertyInclude,
      orderBy: orderByMap[sort],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.property.count({ where }),
  ])

  return { properties, meta: { page, limit, total } }
}

const getPropertyById = async (id: string) => {
  const property = await prisma.property.findUnique({ where: { id }, include: propertyInclude })

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found")
  }

  return property
}

const assertCategoryExists = async (categoryId: string) => {
  const category = await prisma.category.findUnique({ where: { id: categoryId } })

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found")
  }
}

const getOwnedProperty = async (id: string, landlordId: string) => {
  const property = await prisma.property.findUnique({ where: { id } })

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found")
  }

  if (property.landlordId !== landlordId) {
    throw new AppError(httpStatus.FORBIDDEN, "You don't own this property")
  }

  return property
}

const createProperty = async (landlordId: string, payload: CreatePropertyPayload) => {
  await assertCategoryExists(payload.categoryId)

  return prisma.property.create({
    data: { ...payload, landlordId },
    include: propertyInclude,
  })
}

const updateProperty = async (id: string, landlordId: string, payload: UpdatePropertyPayload) => {
  const property = await getOwnedProperty(id, landlordId)

  if (payload.categoryId) {
    await assertCategoryExists(payload.categoryId)
  }

  if (payload.status && property.status === "RENTED") {
    throw new AppError(httpStatus.CONFLICT, "Cannot change the status of a rented property")
  }

  const data = payload as Prisma.PropertyUncheckedUpdateInput

  return prisma.property.update({ where: { id }, data, include: propertyInclude })
}

const deleteProperty = async (id: string, landlordId: string) => {
  await getOwnedProperty(id, landlordId)

  const requestCount = await prisma.request.count({ where: { propertyId: id } })

  if (requestCount > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Cannot delete a property that has requests, mark it unavailable instead",
    )
  }

  await prisma.property.delete({ where: { id } })
}

export const propertyService = {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
}
