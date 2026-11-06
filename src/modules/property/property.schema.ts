import z from "zod"

// Matches the Decimal(12, 2) database columns
const moneySchema = z
  .number()
  .multipleOf(0.01, { error: "Must have at most 2 decimal places" })
  .max(9_999_999_999.99)

export const propertyIdParamsSchema = z.strictObject({
  id: z.uuid(),
})

export type PropertyIdParams = z.output<typeof propertyIdParamsSchema>

export const createPropertySchema = z.strictObject({
  categoryId: z.uuid(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(2000),
  location: z.string().trim().min(2).max(200),
  images: z.array(z.url()).min(1).max(2),
  rent: moneySchema.positive(),
  deposit: moneySchema.nonnegative(),
})

export type CreatePropertyPayload = z.output<typeof createPropertySchema>

export const updatePropertySchema = createPropertySchema
  .extend({
    status: z.enum(["AVAILABLE", "UNAVAILABLE"]),
  })
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  })

export type UpdatePropertyPayload = z.output<typeof updatePropertySchema>

export const propertyListQuerySchema = z
  .strictObject({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().trim().min(1).max(100).optional(),
    categoryId: z.uuid().optional(),
    minRent: z.coerce.number().nonnegative().optional(),
    maxRent: z.coerce.number().nonnegative().optional(),
    sort: z.enum(["NEWEST", "RENT_ASC", "RENT_DESC"]).default("NEWEST"),
  })
  .refine((q) => q.minRent === undefined || q.maxRent === undefined || q.minRent <= q.maxRent, {
    message: "minRent cannot be greater than maxRent",
    path: ["minRent"],
  })

export type PropertyListQuery = z.output<typeof propertyListQuerySchema>
