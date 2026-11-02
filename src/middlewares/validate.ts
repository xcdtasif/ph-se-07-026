import type { Request, Response, NextFunction } from "express"
import httpStatus from "http-status"
import z from "zod"

import { AppError } from "../utils/app-error.js"

type Source = "body" | "query" | "params"

export const validate =
  (schema: z.ZodType, source: Source) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req[source])

    if (!result.success) {
      const { formErrors, fieldErrors } = z.flattenError(result.error)

      next(
        new AppError(httpStatus.BAD_REQUEST, `Validation of ${source} failed`, {
          formErrors,
          fieldErrors,
        }),
      )

      return
    }

    if (source === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      })
    } else {
      req[source] = result.data
    }

    next()
  }
