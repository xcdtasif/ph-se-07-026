import z from "zod"

export const categoryIdParamsSchema = z.strictObject({
  id: z.uuid(),
})

export type CategoryIdParams = z.output<typeof categoryIdParamsSchema>

export const createCategorySchema = z.strictObject({
  name: z.string().trim().min(2).max(50),
})

export type CreateCategoryPayload = z.output<typeof createCategorySchema>

export const updateCategorySchema = z.strictObject({
  name: z.string().trim().min(2).max(50),
})

export type UpdateCategoryPayload = z.output<typeof updateCategorySchema>
