import httpStatus from "http-status"

import { Prisma } from "../generated/prisma/client.js"

type MappedError = {
  statusCode: number
  message: string
  errorDetails?: unknown
}

const getTargetFields = (meta: Record<string, unknown> | undefined): string[] | undefined => {
  const target = meta?.["target"]

  if (Array.isArray(target)) {
    return target.map(String)
  }

  if (typeof target === "string") {
    return [target]
  }

  return undefined
}

const knownErrorMap: Record<string, { statusCode: number; message: string }> = {
  P2000: { statusCode: httpStatus.BAD_REQUEST, message: "A provided value is too long" },
  P2001: { statusCode: httpStatus.NOT_FOUND, message: "Resource not found" },
  P2003: { statusCode: httpStatus.CONFLICT, message: "Related resource constraint failed" },
  P2011: { statusCode: httpStatus.BAD_REQUEST, message: "A required value is null" },
  P2012: { statusCode: httpStatus.BAD_REQUEST, message: "A required value is missing" },
  P2014: {
    statusCode: httpStatus.CONFLICT,
    message: "This change would break a required relation",
  },
  P2015: { statusCode: httpStatus.NOT_FOUND, message: "Related resource not found" },
  P2016: { statusCode: httpStatus.BAD_REQUEST, message: "Invalid query" },
  P2018: { statusCode: httpStatus.NOT_FOUND, message: "Required related resources not found" },
  P2025: { statusCode: httpStatus.NOT_FOUND, message: "Resource not found" },
  P2034: { statusCode: httpStatus.CONFLICT, message: "Conflicting update, please retry" },
  P1001: { statusCode: httpStatus.SERVICE_UNAVAILABLE, message: "Database unavailable" },
  P1002: { statusCode: httpStatus.SERVICE_UNAVAILABLE, message: "Database unavailable" },
  P1008: { statusCode: httpStatus.SERVICE_UNAVAILABLE, message: "Database timed out" },
  P2024: { statusCode: httpStatus.SERVICE_UNAVAILABLE, message: "Database is busy, try again" },
}

export const handlePrismaError = (err: unknown): MappedError | null => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const fields = getTargetFields(err.meta)

      return {
        statusCode: httpStatus.CONFLICT,
        message: fields ? `${fields.join(", ")} already exists` : "Resource already exists",
        errorDetails: fields ? { fields } : undefined,
      }
    }

    const mapped = knownErrorMap[err.code]

    if (mapped) {
      return mapped
    }

    return {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return { statusCode: httpStatus.SERVICE_UNAVAILABLE, message: "Database unavailable" }
  }

  if (
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    return { statusCode: httpStatus.INTERNAL_SERVER_ERROR, message: "Internal server error" }
  }

  return null
}
