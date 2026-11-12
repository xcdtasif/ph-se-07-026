import z from "zod"

export const propertyReviewsParamsSchema = z.strictObject({
  propertyId: z.uuid(),
})

export type PropertyReviewsParams = z.output<typeof propertyReviewsParamsSchema>

export const reviewIdParamsSchema = z.strictObject({
  id: z.uuid(),
})

export type ReviewIdParams = z.output<typeof reviewIdParamsSchema>

export const createReviewSchema = z.strictObject({
  requestId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1000),
})

export type CreateReviewPayload = z.output<typeof createReviewSchema>

export const reviewListQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export type ReviewListQuery = z.output<typeof reviewListQuerySchema>

export const landlordReviewListQuerySchema = reviewListQuerySchema.extend({
  propertyId: z.uuid().optional(),
})

export type LandlordReviewListQuery = z.output<typeof landlordReviewListQuerySchema>

export const adminReviewListQuerySchema = reviewListQuerySchema.extend({
  propertyId: z.uuid().optional(),
  tenantId: z.uuid().optional(),
  isHidden: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
})

export type AdminReviewListQuery = z.output<typeof adminReviewListQuerySchema>

export const updateReviewVisibilitySchema = z.strictObject({
  isHidden: z.boolean(),
})

export type UpdateReviewVisibilityPayload = z.output<typeof updateReviewVisibilitySchema>
