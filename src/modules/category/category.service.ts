import httpStatus from "http-status"

import { prisma } from "../../lib/prisma.js"
import { AppError } from "../../utils/app-error.js"
import type { CreateCategoryPayload, UpdateCategoryPayload } from "./category.schema.js"

const getAllCategories = () => {
  return prisma.category.findMany({ orderBy: { name: "asc" } })
}

const assertNameAvailable = async (name: string, excludeId?: string) => {
  const existing = await prisma.category.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })

  if (existing) {
    throw new AppError(httpStatus.CONFLICT, "Category already exists")
  }
}

const createCategory = async (payload: CreateCategoryPayload) => {
  await assertNameAvailable(payload.name)

  return prisma.category.create({ data: { name: payload.name } })
}

const updateCategory = async (id: string, payload: UpdateCategoryPayload) => {
  await assertNameAvailable(payload.name, id)

  return prisma.category.update({ where: { id }, data: { name: payload.name } })
}

const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { properties: true } } },
  })

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found")
  }

  if (category._count.properties > 0) {
    throw new AppError(httpStatus.CONFLICT, "Cannot delete a category that has properties")
  }

  await prisma.category.delete({ where: { id } })
}

export const categoryService = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
}
