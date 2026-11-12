import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorize.js"
import { validate } from "../../middlewares/validate.js"
import { reviewController } from "./review.controller.js"
import { landlordReviewListQuerySchema } from "./review.schema.js"

const router = Router()

router.use(authenticate, authorize("LANDLORD"))

// Get Reviews For Own Properties
router.get(
  "/",
  validate(landlordReviewListQuerySchema, "query"),
  reviewController.getLandlordReviews,
)

export const landlordReviewRouter = router
