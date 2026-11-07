import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorize.js"
import { validate } from "../../middlewares/validate.js"
import { requestController } from "./request.controller.js"
import {
  createRequestSchema,
  requestIdParamsSchema,
  requestListQuerySchema,
} from "./request.schema.js"

const router = Router()

router.use(authenticate, authorize("TENANT"))

// Create Request
router.post("/", validate(createRequestSchema, "body"), requestController.createRequest)

// Get Own Requests
router.get("/", validate(requestListQuerySchema, "query"), requestController.getTenantRequests)

// Get Own Request By ID
router.get(
  "/:id",
  validate(requestIdParamsSchema, "params"),
  requestController.getTenantRequestById,
)

export const tenantRequestRouter = router
