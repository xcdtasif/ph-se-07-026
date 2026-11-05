export class AppError extends Error {
  statusCode: number
  errorDetails?: unknown

  constructor(statusCode: number, message: string, errorDetails?: unknown) {
    super(message)
    this.name = "AppError"
    this.statusCode = statusCode
    this.errorDetails = errorDetails
  }
}
