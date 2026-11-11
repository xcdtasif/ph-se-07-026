import type { Request, Response } from "express"
import httpStatus from "http-status"

import { AppError } from "../../utils/app-error.js"
import { sendResponse } from "../../utils/send-response.js"
import type {
  UpdateMePayload,
  UpdateUserStatusPayload,
  UserIdParams,
  UserListQuery,
} from "./user.schema.js"
import { userService } from "./user.service.js"

const getUserId = (req: Request<any, any, any, any>) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required")
  }

  return req.user.id
}

const getMe = (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required")
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile fetched successfully",
    data: req.user,
  })
}

const updateMe = async (req: Request<{}, {}, UpdateMePayload>, res: Response) => {
  const user = await userService.updateMe(getUserId(req), req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile updated successfully",
    data: user,
  })
}

const getAllUsers = async (req: Request, res: Response) => {
  const { users, meta } = await userService.getAllUsers(req.query as unknown as UserListQuery)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users fetched successfully",
    data: users,
    meta,
  })
}

const updateUserStatus = async (
  req: Request<UserIdParams, {}, UpdateUserStatusPayload>,
  res: Response,
) => {
  const user = await userService.updateUserStatus(req.params.id, req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: req.body.isBanned ? "User banned successfully" : "User unbanned successfully",
    data: user,
  })
}

export const userController = { getMe, updateMe, getAllUsers, updateUserStatus }
