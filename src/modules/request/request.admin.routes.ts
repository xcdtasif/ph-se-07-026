import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorize.js"
import { validate } from "../../middlewares/validate.js"
import { requestController } from "./request.controller.js"
import { adminRequestListQuerySchema } from "./request.schema.js"

const router = Router()

router.use(authenticate, authorize("ADMIN"))

// Get All Requests
router.get("/", validate(adminRequestListQuerySchema, "query"), requestController.getAdminRequests)

export const adminRequestRouter = router
