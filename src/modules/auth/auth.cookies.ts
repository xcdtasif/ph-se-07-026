import type { CookieOptions, Response } from "express"

import { env } from "../../config/env.js"
import { toMs } from "../../utils/to-ms.js"

const isProduction = env.NODE_ENV === "production"

const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
}

const ACCESS_TOKEN_MAX_AGE = toMs(env.JWT_ACCESS_TOKEN_EXPIRES_IN)
const REFRESH_TOKEN_MAX_AGE = toMs(env.JWT_REFRESH_TOKEN_EXPIRES_IN)

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, { ...baseOptions, maxAge: ACCESS_TOKEN_MAX_AGE })
  res.cookie("refreshToken", refreshToken, { ...baseOptions, maxAge: REFRESH_TOKEN_MAX_AGE })
}

const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", baseOptions)
  res.clearCookie("refreshToken", baseOptions)
}

export const authCookies = { setAuthCookies, clearAuthCookies }
