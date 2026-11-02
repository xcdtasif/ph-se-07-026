import type { Response } from "express"

type Meta = {
  page: number
  limit: number
  total: number
}

type ResData<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
  meta?: Meta
  errors?: unknown
}

export const sendResponse = <T>(res: Response, resData: ResData<T>) => {
  res.status(resData.statusCode).json({
    success: resData.success,
    statusCode: resData.statusCode,
    message: resData.message,
    data: resData.data,
    meta: resData.meta,
    errors: resData.errors,
  })
}
