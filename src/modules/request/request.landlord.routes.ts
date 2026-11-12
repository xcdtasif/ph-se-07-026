import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorize.js"
import { validate } from "../../middlewares/validate.js"
import { requestController } from "./request.controller.js"
import {
  requestIdParamsSchema,
  requestListQuerySchema,
  updateLandlordRequestStatusSchema,
} from "./request.schema.js"

const router = Router()

router.use(authenticate, authorize("LANDLORD"))

// Get Requests For Own Properties
router.get("/", validate(requestListQuerySchema, "query"), requestController.getLandlordRequests)

// Update Request Status
router.patch(
  "/:id",
  validate(requestIdParamsSchema, "params"),
  validate(updateLandlordRequestStatusSchema, "body"),
  requestController.updateLandlordRequestStatus,
)

export const landlordRequestRouter = router
