import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorize.js"
import { validate } from "../../middlewares/validate.js"
import { requestController } from "./request.controller.js"
import {
  requestIdParamsSchema,
  requestListQuerySchema,
  updateRequestStatusSchema,
} from "./request.schema.js"

const router = Router()

router.use(authenticate, authorize("LANDLORD"))

// Get Requests For Own Properties
router.get("/", validate(requestListQuerySchema, "query"), requestController.getLandlordRequests)

// Update Request Status
router.patch(
  "/:id",
  validate(requestIdParamsSchema, "params"),
  validate(updateRequestStatusSchema, "body"),
  requestController.updateRequestStatus,
)

export const landlordRequestRouter = router
