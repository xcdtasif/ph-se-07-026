import httpStatus from "http-status"

import type { Prisma } from "../../generated/prisma/client.js"
import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"
import { visiblePropertyWhere } from "../property/property.filters.js"
import type {
  AdminReviewListQuery,
  CreateReviewPayload,
  LandlordReviewListQuery,
  ReviewListQuery,
  UpdateReviewVisibilityPayload,
} from "./review.schema.js"

const reviewInclude = {
  property: { select: { id: true, name: true, location: true, images: true } },
} satisfies Prisma.ReviewInclude

const publicReviewInclude = {
  tenant: { select: { name: true } },
} satisfies Prisma.ReviewInclude

const landlordReviewInclude = {
  tenant: { select: { name: true } },
  property: reviewInclude.property,
} satisfies Prisma.ReviewInclude

const adminReviewInclude = {
  tenant: { select: { id: true, name: true, email: true } },
  property: reviewInclude.property,
} satisfies Prisma.ReviewInclude

const getPropertyReviews = async (propertyId: string, { page, limit }: ReviewListQuery) => {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, ...visiblePropertyWhere },
    select: { id: true },
  })

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found")
  }

  const where: Prisma.ReviewWhereInput = { propertyId, isHidden: false }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: publicReviewInclude,
      omit: { tenantId: true, requestId: true, isHidden: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ])

  return { reviews, meta: { page, limit, total } }
}

/*
Hidden reviews are left out. Returns a lookup so callers can attach the summary to each property,
which gets zero reviews and no rating when it has none.
*/
const getRatingSummaries = async (propertyIds: string[]) => {
  const groups = await prisma.review.groupBy({
    by: ["propertyId"],
    where: { propertyId: { in: propertyIds }, isHidden: false },
    _avg: { rating: true },
    _count: { _all: true },
  })

  const summaries = new Map(
    groups.map(({ propertyId, _avg, _count }) => [
      propertyId,
      {
        reviewCount: _count._all,
        averageRating: _avg.rating === null ? null : Math.round(_avg.rating * 10) / 10,
      },
    ]),
  )

  return (propertyId: string) =>
    summaries.get(propertyId) ?? { reviewCount: 0, averageRating: null }
}

const createReview = async (tenantId: string, payload: CreateReviewPayload) => {
  const request = await prisma.request.findUnique({
    where: { id: payload.requestId },
    include: { review: { select: { id: true } } },
  })

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, "Request not found")
  }

  if (request.tenantId !== tenantId) {
    throw new AppError(httpStatus.FORBIDDEN, "This request isn't yours")
  }

  if (request.status !== "COMPLETED") {
    throw new AppError(httpStatus.CONFLICT, "You can only review a completed rental")
  }

  if (request.review) {
    throw new AppError(httpStatus.CONFLICT, "You already reviewed this rental")
  }

  /*
  A concurrent duplicate hits the unique requestId and is mapped to 409 by the Prisma error handler.
  */
  return prisma.review.create({
    data: {
      tenantId,
      propertyId: request.propertyId,
      requestId: request.id,
      rating: payload.rating,
      comment: payload.comment,
    },
    include: reviewInclude,
  })
}

const getTenantReviews = async (tenantId: string, { page, limit }: ReviewListQuery) => {
  const where: Prisma.ReviewWhereInput = { tenantId }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ])

  return { reviews, meta: { page, limit, total } }
}

const getTenantReviewById = async (id: string, tenantId: string) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include: reviewInclude,
  })

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found")
  }

  if (review.tenantId !== tenantId) {
    throw new AppError(httpStatus.FORBIDDEN, "This review isn't yours")
  }

  return review
}

const getLandlordReviews = async (
  landlordId: string,
  { page, limit, propertyId }: LandlordReviewListQuery,
) => {
  const where: Prisma.ReviewWhereInput = {
    isHidden: false,
    property: { landlordId },
    ...(propertyId ? { propertyId } : {}),
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: landlordReviewInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ])

  return { reviews, meta: { page, limit, total } }
}

const getAdminReviews = async ({
  page,
  limit,
  propertyId,
  tenantId,
  isHidden,
}: AdminReviewListQuery) => {
  const where: Prisma.ReviewWhereInput = {
    ...(propertyId ? { propertyId } : {}),
    ...(tenantId ? { tenantId } : {}),
    ...(isHidden !== undefined ? { isHidden } : {}),
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: adminReviewInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ])

  return { reviews, meta: { page, limit, total } }
}

const updateReviewVisibility = async (id: string, payload: UpdateReviewVisibilityPayload) => {
  const { count } = await prisma.review.updateMany({ where: { id }, data: payload })

  if (count === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found")
  }

  return prisma.review.findUniqueOrThrow({ where: { id }, include: adminReviewInclude })
}

export const reviewService = {
  getPropertyReviews,
  getRatingSummaries,
  createReview,
  getTenantReviews,
  getTenantReviewById,
  getLandlordReviews,
  getAdminReviews,
  updateReviewVisibility,
}
