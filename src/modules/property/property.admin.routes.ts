import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorize.js"
import { validate } from "../../middlewares/validate.js"
import { propertyController } from "./property.controller.js"
import {
  adminPropertyListQuerySchema,
  propertyIdParamsSchema,
  updatePropertyVisibilitySchema,
} from "./property.schema.js"

const router = Router()

router.use(authenticate, authorize("ADMIN"))

// Get All Properties
router.get(
  "/",
  validate(adminPropertyListQuerySchema, "query"),
  propertyController.getAdminProperties,
)

// Update Property Visibility
router.patch(
  "/:id",
  validate(propertyIdParamsSchema, "params"),
  validate(updatePropertyVisibilitySchema, "body"),
  propertyController.updatePropertyVisibility,
)

export const adminPropertyRouter = router
