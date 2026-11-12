import { Router } from "express"

import { validate } from "../../middlewares/validate.js"
import { reviewController } from "./review.controller.js"
import { propertyReviewsParamsSchema, reviewListQuerySchema } from "./review.schema.js"

const router = Router()

// Get Property Reviews
router.get(
  "/:propertyId/reviews",
  validate(propertyReviewsParamsSchema, "params"),
  validate(reviewListQuerySchema, "query"),
  reviewController.getPropertyReviews,
)

export const reviewRouter = router
