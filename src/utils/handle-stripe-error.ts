import httpStatus from "http-status"
import Stripe from "stripe"

type MappedError = {
  statusCode: number
  message: string
  errorDetails?: unknown
}

export const handleStripeError = (err: unknown): MappedError | null => {
  if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
    return { statusCode: httpStatus.BAD_REQUEST, message: "Invalid webhook signature" }
  }

  if (err instanceof Stripe.errors.StripeRateLimitError) {
    return {
      statusCode: httpStatus.TOO_MANY_REQUESTS,
      message: "Payment provider is busy, try again",
    }
  }

  if (err instanceof Stripe.errors.StripeConnectionError) {
    return { statusCode: httpStatus.SERVICE_UNAVAILABLE, message: "Payment provider unavailable" }
  }

  if (err instanceof Stripe.errors.StripeError) {
    return {
      statusCode: httpStatus.BAD_GATEWAY,
      message: "Payment provider error",
      errorDetails: err.code ? { code: err.code } : undefined,
    }
  }

  return null
}
