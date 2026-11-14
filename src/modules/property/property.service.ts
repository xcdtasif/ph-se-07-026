import httpStatus from "http-status"

import type { Prisma, PropertyStatus } from "../../generated/prisma/client.js"
import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"
import { categoryService } from "../category/category.service.js"
import { reviewService } from "../review/review.service.js"
import { uploadService } from "../upload/upload.service.js"
import { visiblePropertyWhere } from "./property.filters.js"
import { getOwnedProperty } from "./property.ownership.js"
import type {
  AdminPropertyListQuery,
  CreatePropertyPayload,
  LandlordPropertyListQuery,
  PropertyListQuery,
  UpdatePropertyPayload,
  UpdatePropertyVisibilityPayload,
} from "./property.schema.js"

const propertyInclude = {
  landlord: { select: { id: true, name: true } },
  category: true,
} satisfies Prisma.PropertyInclude

const adminPropertyInclude = {
  landlord: { select: { id: true, name: true, email: true, isBanned: true } },
  category: true,
} satisfies Prisma.PropertyInclude

const orderByMap: Record<PropertyListQuery["sort"], Prisma.PropertyOrderByWithRelationInput> = {
  NEWEST: { createdAt: "desc" },
  RENT_ASC: { rent: "asc" },
  RENT_DESC: { rent: "desc" },
}

const searchWhere = (search?: string): Prisma.PropertyWhereInput =>
  search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {}

const getAllProperties = async (query: PropertyListQuery) => {
  const { page, limit, search, categoryId, minRent, maxRent, sort } = query

  const where: Prisma.PropertyWhereInput = {
    ...visiblePropertyWhere,
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
    ...searchWhere(search),
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

  const summaryFor = await reviewService.getRatingSummaries(properties.map(({ id }) => id))

  return {
    properties: properties.map((property) => ({ ...property, ...summaryFor(property.id) })),
    meta: { page, limit, total },
  }
}

const getPropertyById = async (id: string) => {
  const property = await prisma.property.findFirst({
    where: { id, ...visiblePropertyWhere },
    include: propertyInclude,
  })

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found")
  }

  const summaryFor = await reviewService.getRatingSummaries([id])

  return { ...property, ...summaryFor(id) }
}

const createProperty = async (landlordId: string, payload: CreatePropertyPayload) => {
  await categoryService.assertCategoryExists(payload.categoryId)

  return prisma.property.create({
    data: { ...payload, landlordId },
    include: propertyInclude,
  })
}

const updateProperty = async (id: string, landlordId: string, payload: UpdatePropertyPayload) => {
  const existing = await getOwnedProperty(id, landlordId)

  if (payload.categoryId) {
    await categoryService.assertCategoryExists(payload.categoryId)
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

const getLandlordProperties = async (landlordId: string, query: LandlordPropertyListQuery) => {
  const { page, limit, search, status, isHidden } = query

  const where: Prisma.PropertyWhereInput = {
    landlordId,
    ...(status ? { status } : {}),
    ...(isHidden !== undefined ? { isHidden } : {}),
    ...searchWhere(search),
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: propertyInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.property.count({ where }),
  ])

  const summaryFor = await reviewService.getRatingSummaries(properties.map(({ id }) => id))

  return {
    properties: properties.map((property) => ({ ...property, ...summaryFor(property.id) })),
    meta: { page, limit, total },
  }
}

const getAdminProperties = async (query: AdminPropertyListQuery) => {
  const { page, limit, search, landlordId, status, isHidden } = query

  const where: Prisma.PropertyWhereInput = {
    ...(landlordId ? { landlordId } : {}),
    ...(status ? { status } : {}),
    ...(isHidden !== undefined ? { isHidden } : {}),
    ...searchWhere(search),
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: adminPropertyInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.property.count({ where }),
  ])

  return { properties, meta: { page, limit, total } }
}

const updatePropertyVisibility = async (id: string, payload: UpdatePropertyVisibilityPayload) => {
  const { count } = await prisma.property.updateMany({ where: { id }, data: payload })

  if (count === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found")
  }

  return prisma.property.findUniqueOrThrow({ where: { id }, include: adminPropertyInclude })
}

export const propertyService = {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getLandlordProperties,
  getAdminProperties,
  updatePropertyVisibility,
}
