import httpStatus from "http-status"

import type { Prisma } from "../../generated/prisma/client.js"
import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"
import type { CreateReviewPayload, ReviewListQuery } from "./review.schema.js"

const reviewInclude = {
  property: { select: { id: true, name: true, location: true, images: true } },
} satisfies Prisma.ReviewInclude

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

export const reviewService = {
  createReview,
  getTenantReviews,
  getTenantReviewById,
}
