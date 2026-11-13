import httpStatus from "http-status"

import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"

// Property and review services both need this, so it lives apart from either to avoid a cycle
export const getOwnedProperty = async (id: string, landlordId: string) => {
  const property = await prisma.property.findUnique({ where: { id } })

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found")
  }

  if (property.landlordId !== landlordId) {
    throw new AppError(httpStatus.FORBIDDEN, "You don't own this property")
  }

  return property
}
