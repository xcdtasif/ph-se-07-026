import type { Request, Response } from "express"
import httpStatus from "http-status"

import { sendResponse } from "../../utils/send-response.js"
import type {
  CategoryIdParams,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "./category.schema.js"
import { categoryService } from "./category.service.js"

const getAllCategories = async (_req: Request, res: Response) => {
  const categories = await categoryService.getAllCategories()

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories fetched successfully",
    data: categories,
  })
}

const createCategory = async (req: Request<{}, {}, CreateCategoryPayload>, res: Response) => {
  const category = await categoryService.createCategory(req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Category created successfully",
    data: category,
  })
}

const updateCategory = async (
  req: Request<CategoryIdParams, {}, UpdateCategoryPayload>,
  res: Response,
) => {
  const category = await categoryService.updateCategory(req.params.id, req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category updated successfully",
    data: category,
  })
}

const deleteCategory = async (req: Request<CategoryIdParams>, res: Response) => {
  await categoryService.deleteCategory(req.params.id)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category deleted successfully",
  })
}

export const categoryController = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
}
