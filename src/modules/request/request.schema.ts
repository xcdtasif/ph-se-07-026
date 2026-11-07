import z from "zod"

const requestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED"])

export const requestIdParamsSchema = z.strictObject({
  id: z.uuid(),
})

export type RequestIdParams = z.output<typeof requestIdParamsSchema>

export const createRequestSchema = z.strictObject({
  propertyId: z.uuid(),
  message: z.string().trim().min(10).max(1000),
})

export type CreateRequestPayload = z.output<typeof createRequestSchema>

export const requestListQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: requestStatusSchema.optional(),
})

export type RequestListQuery = z.output<typeof requestListQuerySchema>

// ACTIVE is set by the payment webhook only
export const updateRequestStatusSchema = z.strictObject({
  status: z.enum(["APPROVED", "REJECTED", "COMPLETED"]),
})

export type UpdateRequestStatusPayload = z.output<typeof updateRequestStatusSchema>
