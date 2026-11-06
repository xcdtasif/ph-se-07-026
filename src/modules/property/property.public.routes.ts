import { Router } from "express"

import { validate } from "../../middlewares/validate.js"
import { propertyController } from "./property.controller.js"
import { propertyIdParamsSchema, propertyListQuerySchema } from "./property.schema.js"

const router = Router()

// Get All Properties
router.get("/", validate(propertyListQuerySchema, "query"), propertyController.getAllProperties)

// Get Property By ID
router.get("/:id", validate(propertyIdParamsSchema, "params"), propertyController.getPropertyById)

export const publicPropertyRouter = router
