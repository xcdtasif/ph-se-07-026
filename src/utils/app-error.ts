export class AppError extends Error {
  statusCode: number
  errors?: unknown

  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message)
    this.name = "AppError"
    this.statusCode = statusCode
    this.errors = errors
  }
}
