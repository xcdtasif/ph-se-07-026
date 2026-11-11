import z from "zod"

import { UserRole } from "../../generated/prisma/enums.js"

export const nameSchema = z.string().trim().min(2).max(100)

export const updateMeSchema = z.strictObject({
  name: nameSchema,
})

export type UpdateMePayload = z.output<typeof updateMeSchema>

export const userListQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().min(1).max(100).optional(),
  role: z.enum(UserRole).optional(),
  isBanned: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
})

export type UserListQuery = z.output<typeof userListQuerySchema>

export const userIdParamsSchema = z.strictObject({
  id: z.uuid(),
})

export type UserIdParams = z.output<typeof userIdParamsSchema>

export const updateUserStatusSchema = z.strictObject({
  isBanned: z.boolean(),
})

export type UpdateUserStatusPayload = z.output<typeof updateUserStatusSchema>
