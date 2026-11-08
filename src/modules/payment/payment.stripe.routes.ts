import { Router } from "express"

import { paymentController } from "./payment.controller.js"

const router = Router()

// Stripe Webhook
router.post("/", paymentController.handleWebhook)

export const stripeWebhookRouter = router
