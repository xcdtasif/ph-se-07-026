import z from "zod"

export const registerUserSchema = z.strictObject({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .min(8)
    .max(72, { error: "Password must be at most 72 bytes", abort: true })
    .refine((v) => new TextEncoder().encode(v).length <= 72, {
      error: "Password must be at most 72 bytes",
    }),
  role: z.enum(["LANDLORD", "TENANT"]),
})

export type RegisterUserPayload = z.output<typeof registerUserSchema>
