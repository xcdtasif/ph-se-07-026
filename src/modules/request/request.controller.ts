import type { Request, Response } from "express"
import httpStatus from "http-status"

import { AppError } from "../../utils/app-error.js"
import { sendResponse } from "../../utils/send-response.js"
import type {
  AdminRequestListQuery,
  CreateRequestPayload,
  RequestIdParams,
  RequestListQuery,
  UpdateLandlordRequestStatusPayload,
  UpdateTenantRequestStatusPayload,
} from "./request.schema.js"
import { requestService } from "./request.service.js"

const getUserId = (req: Request<any, any, any, any>) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required")
  }

  return req.user.id
}

const createRequest = async (req: Request<{}, {}, CreateRequestPayload>, res: Response) => {
  const request = await requestService.createRequest(getUserId(req), req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Request created successfully",
    data: request,
  })
}

const getTenantRequests = async (req: Request, res: Response) => {
  const { requests, meta } = await requestService.getTenantRequests(
    getUserId(req),
    req.query as unknown as RequestListQuery,
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Requests fetched successfully",
    data: requests,
    meta,
  })
}

const getTenantRequestById = async (req: Request<RequestIdParams>, res: Response) => {
  const request = await requestService.getTenantRequestById(req.params.id, getUserId(req))

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Request fetched successfully",
    data: request,
  })
}

const updateTenantRequestStatus = async (
  req: Request<RequestIdParams, {}, UpdateTenantRequestStatusPayload>,
  res: Response,
) => {
  const request = await requestService.updateTenantRequestStatus(
    req.params.id,
    getUserId(req),
    req.body,
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Request cancelled successfully",
    data: request,
  })
}

const getLandlordRequests = async (req: Request, res: Response) => {
  const { requests, meta } = await requestService.getLandlordRequests(
    getUserId(req),
    req.query as unknown as RequestListQuery,
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Requests fetched successfully",
    data: requests,
    meta,
  })
}

const updateLandlordRequestStatus = async (
  req: Request<RequestIdParams, {}, UpdateLandlordRequestStatusPayload>,
  res: Response,
) => {
  const request = await requestService.updateLandlordRequestStatus(
    req.params.id,
    getUserId(req),
    req.body,
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Request status updated successfully",
    data: request,
  })
}

const getAdminRequests = async (req: Request, res: Response) => {
  const { requests, meta } = await requestService.getAdminRequests(
    req.query as unknown as AdminRequestListQuery,
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Requests fetched successfully",
    data: requests,
    meta,
  })
}

export const requestController = {
  createRequest,
  getTenantRequests,
  getTenantRequestById,
  updateTenantRequestStatus,
  getLandlordRequests,
  updateLandlordRequestStatus,
  getAdminRequests,
}
