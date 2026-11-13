import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import type { Application, Request, Response } from "express"

import { env } from "./config/env.js"
import { errorHandler } from "./middlewares/error-handler.js"
import { notFound } from "./middlewares/not-found.js"
import { authRouter } from "./modules/auth/auth.routes.js"
import { categoryRouter } from "./modules/category/category.routes.js"
import { stripeWebhookRouter } from "./modules/payment/payment.stripe.routes.js"
import { tenantPaymentRouter } from "./modules/payment/payment.tenant.routes.js"
import { adminPropertyRouter } from "./modules/property/property.admin.routes.js"
import { landlordPropertyRouter } from "./modules/property/property.landlord.routes.js"
import { propertyRouter } from "./modules/property/property.routes.js"
import { adminRequestRouter } from "./modules/request/request.admin.routes.js"
import { landlordRequestRouter } from "./modules/request/request.landlord.routes.js"
import { tenantRequestRouter } from "./modules/request/request.tenant.routes.js"
import { adminReviewRouter } from "./modules/review/review.admin.routes.js"
import { landlordReviewRouter } from "./modules/review/review.landlord.routes.js"
import { reviewRouter } from "./modules/review/review.routes.js"
import { tenantReviewRouter } from "./modules/review/review.tenant.routes.js"
import { uploadRouter } from "./modules/upload/upload.routes.js"
import { adminUserRouter } from "./modules/user/user.admin.routes.js"
import { userRouter } from "./modules/user/user.routes.js"
import "./types/express.js"

const app: Application = express()

const corsOptions: cors.CorsOptions = {
  origin: env.CLIENT_URL,
  credentials: true,
}

app.use(cors(corsOptions))

// Stripe needs the raw body to verify the webhook signature
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get("/", (_req: Request, res: Response) => {
  res.send("Server is running")
})

// Auth
app.use("/api/auth", authRouter)

// User
app.use("/api/users", userRouter)
app.use("/api/admin/users", adminUserRouter)

// Category
app.use("/api/categories", categoryRouter)

// Property
app.use("/api/properties", propertyRouter)
app.use("/api/landlord/properties", landlordPropertyRouter)
app.use("/api/admin/properties", adminPropertyRouter)

// Request
app.use("/api/tenant/requests", tenantRequestRouter)
app.use("/api/landlord/requests", landlordRequestRouter)
app.use("/api/admin/requests", adminRequestRouter)

// Payment
app.use("/api/tenant/payments", tenantPaymentRouter)
app.use("/api/stripe/webhook", stripeWebhookRouter)

// Review
app.use("/api/properties", reviewRouter)
app.use("/api/tenant/reviews", tenantReviewRouter)
app.use("/api/landlord/reviews", landlordReviewRouter)
app.use("/api/admin/reviews", adminReviewRouter)

// Upload
app.use("/api/uploadthing", uploadRouter)

app.use(notFound)
app.use(errorHandler)

export default app
