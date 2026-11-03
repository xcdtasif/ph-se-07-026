import type { Request, Response } from "express"
import httpStatus from "http-status"

import { sendResponse } from "../../utils/send-response.js"
import { authCookies } from "./auth.cookies.js"
import type { LoginUserPayload, RegisterUserPayload } from "./auth.schema.js"
import { authService } from "./auth.service.js"

const registerUser = async (req: Request<{}, {}, RegisterUserPayload>, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body)

  authCookies.setAuthCookies(res, accessToken, refreshToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User registered successfully",
    data: user,
  })
}

const loginUser = async (req: Request<{}, {}, LoginUserPayload>, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body)

  authCookies.setAuthCookies(res, accessToken, refreshToken)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Logged in successfully",
    data: user,
  })
}

const logoutUser = (_req: Request, res: Response) => {
  authCookies.clearAuthCookies(res)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Logged out successfully",
  })
}

export const authController = { registerUser, loginUser, logoutUser }
