import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorize.js"
import { validate } from "../../middlewares/validate.js"
import { reviewController } from "./review.controller.js"
import {
  adminReviewListQuerySchema,
  reviewIdParamsSchema,
  updateReviewVisibilitySchema,
} from "./review.schema.js"

const router = Router()

router.use(authenticate, authorize("ADMIN"))

// Get All Reviews
router.get("/", validate(adminReviewListQuerySchema, "query"), reviewController.getAdminReviews)

// Update Review Visibility
router.patch(
  "/:id",
  validate(reviewIdParamsSchema, "params"),
  validate(updateReviewVisibilitySchema, "body"),
  reviewController.updateReviewVisibility,
)

export const adminReviewRouter = router
