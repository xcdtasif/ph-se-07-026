import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorize.js"
import { validate } from "../../middlewares/validate.js"
import { categoryController } from "./category.controller.js"
import {
  categoryIdParamsSchema,
  createCategorySchema,
  updateCategorySchema,
} from "./category.schema.js"

const router = Router()

// Get All Categories
router.get("/", categoryController.getAllCategories)

// Create Category
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCategorySchema, "body"),
  categoryController.createCategory,
)

// Update Category
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(categoryIdParamsSchema, "params"),
  validate(updateCategorySchema, "body"),
  categoryController.updateCategory,
)

// Delete Category
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(categoryIdParamsSchema, "params"),
  categoryController.deleteCategory,
)

export const categoryRouter = router
