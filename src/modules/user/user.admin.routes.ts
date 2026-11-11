import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorize.js"
import { validate } from "../../middlewares/validate.js"
import { userController } from "./user.controller.js"
import { updateUserStatusSchema, userIdParamsSchema, userListQuerySchema } from "./user.schema.js"

const router = Router()

router.use(authenticate, authorize("ADMIN"))

// Get All Users
router.get("/", validate(userListQuerySchema, "query"), userController.getAllUsers)

// Update User Status
router.patch(
  "/:id",
  validate(userIdParamsSchema, "params"),
  validate(updateUserStatusSchema, "body"),
  userController.updateUserStatus,
)

export const adminUserRouter = router
