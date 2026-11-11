import httpStatus from "http-status"

import type { Prisma, PropertyStatus } from "../../generated/prisma/client.js"
import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"
import { uploadService } from "../upload/upload.service.js"
import type {
  CreatePropertyPayload,
  PropertyListQuery,
  UpdatePropertyPayload,
} from "./property.schema.js"

const propertyInclude = {
  landlord: { select: { id: true, name: true } },
  category: true,
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
  const existing = await getOwnedProperty(id, landlordId)

  if (payload.categoryId) {
    await assertCategoryExists(payload.categoryId)
  }

  const data = payload as Prisma.PropertyUncheckedUpdateManyInput

  /*
  RESERVED holds the property for a tenant's deposit, so it cannot be edited at all, and RENTED
  cannot change status. Both are held by the request flow. Checked in the write itself so a
  concurrent approval cannot be overwritten.
  */
  const lockedStatuses: PropertyStatus[] = payload.status ? ["RESERVED", "RENTED"] : ["RESERVED"]

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.property.updateMany({
      where: { id, status: { notIn: lockedStatuses } },
      data,
    })

    if (count === 0) {
      throw new AppError(
        httpStatus.CONFLICT,
        payload.status
          ? "Cannot change the status of a reserved or rented property"
          : "Cannot update a reserved property",
      )
    }

    // Hiding a property closes it to requests, so pending ones are rejected
    if (payload.status === "UNAVAILABLE") {
      await tx.request.updateMany({
        where: { propertyId: id, status: "PENDING" },
        data: { status: "REJECTED" },
      })
    }

    return tx.property.findUniqueOrThrow({ where: { id }, include: propertyInclude })
  })

  if (payload.images) {
    const newImages = payload.images
    await uploadService.deleteUnusedImages(
      existing.images.filter((url) => !newImages.includes(url)),
    )
  }

  return updated
}

const deleteProperty = async (id: string, landlordId: string) => {
  const existing = await getOwnedProperty(id, landlordId)

  const requestCount = await prisma.request.count({ where: { propertyId: id } })

  if (requestCount > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Cannot delete a property that has requests, mark it unavailable instead",
    )
  }

  await prisma.property.delete({ where: { id } })

  await uploadService.deleteUnusedImages(existing.images)
}

export const propertyService = {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
}
