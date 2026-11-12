import type { Request, Response } from "express"
import httpStatus from "http-status"

import { AppError } from "../../utils/app-error.js"
import { sendResponse } from "../../utils/send-response.js"
import type {
  AdminPropertyListQuery,
  CreatePropertyPayload,
  PropertyIdParams,
  PropertyListQuery,
  UpdatePropertyPayload,
  UpdatePropertyVisibilityPayload,
} from "./property.schema.js"
import { propertyService } from "./property.service.js"

const getLandlordId = (req: Request<any, any, any, any>) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required")
  }

  return req.user.id
}

const getAllProperties = async (req: Request, res: Response) => {
  const { properties, meta } = await propertyService.getAllProperties(
    req.query as unknown as PropertyListQuery,
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Properties fetched successfully",
    data: properties,
    meta,
  })
}

const getPropertyById = async (req: Request<PropertyIdParams>, res: Response) => {
  const property = await propertyService.getPropertyById(req.params.id)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property fetched successfully",
    data: property,
  })
}

const createProperty = async (req: Request<{}, {}, CreatePropertyPayload>, res: Response) => {
  const property = await propertyService.createProperty(getLandlordId(req), req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Property created successfully",
    data: property,
  })
}

const updateProperty = async (
  req: Request<PropertyIdParams, {}, UpdatePropertyPayload>,
  res: Response,
) => {
  const property = await propertyService.updateProperty(req.params.id, getLandlordId(req), req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property updated successfully",
    data: property,
  })
}

const deleteProperty = async (req: Request<PropertyIdParams>, res: Response) => {
  await propertyService.deleteProperty(req.params.id, getLandlordId(req))

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property deleted successfully",
  })
}

const getAdminProperties = async (req: Request, res: Response) => {
  const { properties, meta } = await propertyService.getAdminProperties(
    req.query as unknown as AdminPropertyListQuery,
  )

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Properties fetched successfully",
    data: properties,
    meta,
  })
}

const updatePropertyVisibility = async (
  req: Request<PropertyIdParams, {}, UpdatePropertyVisibilityPayload>,
  res: Response,
) => {
  const property = await propertyService.updatePropertyVisibility(req.params.id, req.body)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: req.body.isHidden ? "Property hidden successfully" : "Property unhidden successfully",
    data: property,
  })
}

export const propertyController = {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getAdminProperties,
  updatePropertyVisibility,
}
