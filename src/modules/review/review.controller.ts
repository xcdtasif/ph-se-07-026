import type { Request, Response } from "express"
import httpStatus from "http-status"

import { AppError } from "../../utils/app-error.js"
import { sendResponse } from "../../utils/send-response.js"
import type { CreateReviewPayload, ReviewIdParams, ReviewListQuery } from "./review.schema.js"
import { reviewService } from "./review.service.js"

const getUserId = (req: Request<any, any, any, any>) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required")
  }

  return req.user.id
}

const createReview = async (req: Request<{}, {}, CreateReviewPayload>, res: Response) => {
  const review = await reviewService.createReview(getUserId(req), req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review created successfully",
    data: review,
  })
}

const getTenantReviews = async (req: Request, res: Response) => {
  const { reviews, meta } = await reviewService.getTenantReviews(
    getUserId(req),
    req.query as unknown as ReviewListQuery,
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reviews fetched successfully",
    data: reviews,
    meta,
  })
}

const getTenantReviewById = async (req: Request<ReviewIdParams>, res: Response) => {
  const review = await reviewService.getTenantReviewById(req.params.id, getUserId(req))

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review fetched successfully",
    data: review,
  })
}

export const reviewController = {
  createReview,
  getTenantReviews,
  getTenantReviewById,
}
