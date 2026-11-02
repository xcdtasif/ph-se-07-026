import type { Request, Response } from "express"
import httpStatus from "http-status"

import { sendResponse } from "../../utils/send-response.js"
import type { RegisterUserPayload } from "./auth.schema.js"
import { authService } from "./auth.service.js"

const registerUser = async (req: Request<{}, {}, RegisterUserPayload>, res: Response) => {
  const payload = req.body

  const user = await authService.registerUser(payload)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User registered successfully",
    data: user,
  })
}

export const authController = {
  registerUser,
}
