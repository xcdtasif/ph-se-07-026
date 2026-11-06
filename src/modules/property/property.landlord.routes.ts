import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorize.js"
import { validate } from "../../middlewares/validate.js"
import { propertyController } from "./property.controller.js"
import {
  createPropertySchema,
  propertyIdParamsSchema,
  updatePropertySchema,
} from "./property.schema.js"

const router = Router()

router.use(authenticate, authorize("LANDLORD"))

// Create Property
router.post("/", validate(createPropertySchema, "body"), propertyController.createProperty)

// Update Property
router.patch(
  "/:id",
  validate(propertyIdParamsSchema, "params"),
  validate(updatePropertySchema, "body"),
  propertyController.updateProperty,
)

// Delete Property
router.delete("/:id", validate(propertyIdParamsSchema, "params"), propertyController.deleteProperty)

export const landlordPropertyRouter = router
