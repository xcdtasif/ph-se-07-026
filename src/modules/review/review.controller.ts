import type { Request, Response } from "express"
import httpStatus from "http-status"

import { AppError } from "../../utils/app-error.js"
import { sendResponse } from "../../utils/send-response.js"
import type {
  AdminReviewListQuery,
  CreateReviewPayload,
  LandlordReviewListQuery,
  PropertyReviewsParams,
  ReviewIdParams,
  ReviewListQuery,
  UpdateReviewVisibilityPayload,
} from "./review.schema.js"
import { reviewService } from "./review.service.js"

const getUserId = (req: Request<any, any, any, any>) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required")
  }

  return req.user.id
}

const getPropertyReviews = async (req: Request<PropertyReviewsParams>, res: Response) => {
  const { reviews, meta } = await reviewService.getPropertyReviews(
    req.params.propertyId,
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

const getLandlordReviews = async (req: Request, res: Response) => {
  const { reviews, meta } = await reviewService.getLandlordReviews(
    getUserId(req),
    req.query as unknown as LandlordReviewListQuery,
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reviews fetched successfully",
    data: reviews,
    meta,
  })
}

const getAdminReviews = async (req: Request, res: Response) => {
  const { reviews, meta } = await reviewService.getAdminReviews(
    req.query as unknown as AdminReviewListQuery,
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reviews fetched successfully",
    data: reviews,
    meta,
  })
}

const updateReviewVisibility = async (
  req: Request<ReviewIdParams, {}, UpdateReviewVisibilityPayload>,
  res: Response,
) => {
  const review = await reviewService.updateReviewVisibility(req.params.id, req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: req.body.isHidden ? "Review hidden successfully" : "Review unhidden successfully",
    data: review,
  })
}

export const reviewController = {
  getPropertyReviews,
  createReview,
  getTenantReviews,
  getTenantReviewById,
  getLandlordReviews,
  getAdminReviews,
  updateReviewVisibility,
}
