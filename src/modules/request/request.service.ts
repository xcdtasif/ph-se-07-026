import httpStatus from "http-status"

import type { Prisma, PropertyStatus, RequestStatus } from "../../generated/prisma/client.js"
import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"
import { activeCheckoutWhere } from "../payment/payment.checkout.js"
import { visiblePropertyWhere } from "../property/property.filters.js"
import type {
  CreateRequestPayload,
  RequestListQuery,
  UpdateLandlordRequestStatusPayload,
  UpdateTenantRequestStatusPayload,
} from "./request.schema.js"

const propertySelect = {
  id: true,
  landlordId: true,
  name: true,
  location: true,
  images: true,
  rent: true,
  deposit: true,
  status: true,
} satisfies Prisma.PropertySelect

const tenantRequestInclude = {
  property: { select: propertySelect },
} satisfies Prisma.RequestInclude

const landlordRequestInclude = {
  tenant: { select: { id: true, name: true, email: true } },
  property: { select: propertySelect },
} satisfies Prisma.RequestInclude

type PropertyChange = { from: PropertyStatus; to: PropertyStatus } | null

type Transitions = Partial<Record<RequestStatus, Partial<Record<RequestStatus, PropertyChange>>>>

/*
Request transitions each side may make, with the property status change each one causes.
APPROVED -> ACTIVE is made by the payment webhook, not here.
*/
const tenantTransitions: Transitions = {
  PENDING: {
    CANCELLED: null,
  },
  APPROVED: {
    CANCELLED: { from: "RESERVED", to: "AVAILABLE" },
  },
}

const landlordTransitions: Transitions = {
  PENDING: {
    APPROVED: { from: "AVAILABLE", to: "RESERVED" },
    REJECTED: null,
  },
  APPROVED: {
    REJECTED: { from: "RESERVED", to: "AVAILABLE" },
  },
  ACTIVE: {
    COMPLETED: { from: "RENTED", to: "AVAILABLE" },
  },
}

// A tenant cannot have more than one of these open for the same property
const openStatuses: RequestStatus[] = ["PENDING", "APPROVED", "ACTIVE"]

const paginate = ({ page, limit }: RequestListQuery) => ({
  skip: (page - 1) * limit,
  take: limit,
})

const createRequest = async (tenantId: string, payload: CreateRequestPayload) => {
  const property = await prisma.property.findFirst({
    where: { id: payload.propertyId, ...visiblePropertyWhere },
  })

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found")
  }

  if (property.status !== "AVAILABLE") {
    throw new AppError(httpStatus.CONFLICT, "Property is not available")
  }

  const openRequest = await prisma.request.findFirst({
    where: { tenantId, propertyId: property.id, status: { in: openStatuses } },
  })

  if (openRequest) {
    throw new AppError(httpStatus.CONFLICT, "You already have an open request for this property")
  }

  return prisma.request.create({
    data: { ...payload, tenantId },
    include: tenantRequestInclude,
  })
}

const getTenantRequests = async (tenantId: string, query: RequestListQuery) => {
  const where: Prisma.RequestWhereInput = {
    tenantId,
    ...(query.status ? { status: query.status } : {}),
  }

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      include: tenantRequestInclude,
      orderBy: { createdAt: "desc" },
      ...paginate(query),
    }),
    prisma.request.count({ where }),
  ])

  return { requests, meta: { page: query.page, limit: query.limit, total } }
}

const getTenantRequestById = async (id: string, tenantId: string) => {
  const request = await prisma.request.findUnique({
    where: { id },
    include: tenantRequestInclude,
  })

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, "Request not found")
  }

  if (request.tenantId !== tenantId) {
    throw new AppError(httpStatus.FORBIDDEN, "This request isn't yours")
  }

  return request
}

const getLandlordRequests = async (landlordId: string, query: RequestListQuery) => {
  const where: Prisma.RequestWhereInput = {
    property: { landlordId },
    ...(query.status ? { status: query.status } : {}),
  }

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      include: landlordRequestInclude,
      orderBy: { createdAt: "desc" },
      ...paginate(query),
    }),
    prisma.request.count({ where }),
  ])

  return { requests, meta: { page: query.page, limit: query.limit, total } }
}

const transitionRequest = <T>(
  request: { id: string; status: RequestStatus; propertyId: string },
  status: RequestStatus,
  transitions: Transitions,
  checkoutMessage: string,
  read: (tx: Prisma.TransactionClient) => Promise<T>,
) => {
  const allowed = transitions[request.status]

  if (!allowed || !(status in allowed)) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Cannot change a ${request.status} request to ${status}`,
    )
  }

  const propertyChange = allowed[status]

  return prisma.$transaction(async (tx) => {
    // Guard on the status we validated so a concurrent change cannot be overwritten
    const { count } = await tx.request.updateMany({
      where: { id: request.id, status: request.status },
      data: { status },
    })

    if (count === 0) {
      throw new AppError(httpStatus.CONFLICT, "Request status has changed, please retry")
    }

    /*
    Checked after the update above has locked the request row. Creating a payment holds the same
    lock until its payment is inserted, so ending an approved request and a new checkout cannot
    both succeed.
    */
    if (request.status === "APPROVED") {
      const checkoutInProgress = await tx.payment.count({ where: activeCheckoutWhere(request.id) })

      if (checkoutInProgress > 0) {
        throw new AppError(httpStatus.CONFLICT, checkoutMessage)
      }
    }

    if (propertyChange) {
      const { count: propertyCount } = await tx.property.updateMany({
        where: {
          id: request.propertyId,
          status: propertyChange.from,
          ...(status === "APPROVED" ? visiblePropertyWhere : {}),
        },
        data: { status: propertyChange.to },
      })

      if (propertyCount === 0) {
        throw new AppError(
          httpStatus.CONFLICT,
          `Property is not ${propertyChange.from.toLowerCase()}`,
        )
      }
    }

    return read(tx)
  })
}

const updateTenantRequestStatus = async (
  id: string,
  tenantId: string,
  { status }: UpdateTenantRequestStatusPayload,
) => {
  const request = await prisma.request.findUnique({ where: { id } })

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, "Request not found")
  }

  if (request.tenantId !== tenantId) {
    throw new AppError(httpStatus.FORBIDDEN, "This request isn't yours")
  }

  return transitionRequest(
    request,
    status,
    tenantTransitions,
    "You are paying the deposit, try again after the checkout ends",
    (tx) => tx.request.findUniqueOrThrow({ where: { id }, include: tenantRequestInclude }),
  )
}

const updateLandlordRequestStatus = async (
  id: string,
  landlordId: string,
  { status }: UpdateLandlordRequestStatusPayload,
) => {
  const request = await prisma.request.findUnique({
    where: { id },
    include: { property: { select: { landlordId: true } } },
  })

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, "Request not found")
  }

  if (request.property.landlordId !== landlordId) {
    throw new AppError(httpStatus.FORBIDDEN, "This request isn't for your property")
  }

  return transitionRequest(
    request,
    status,
    landlordTransitions,
    "The tenant is paying the deposit, try again after the checkout ends",
    (tx) => tx.request.findUniqueOrThrow({ where: { id }, include: landlordRequestInclude }),
  )
}

export const requestService = {
  createRequest,
  getTenantRequests,
  getTenantRequestById,
  updateTenantRequestStatus,
  getLandlordRequests,
  updateLandlordRequestStatus,
}
