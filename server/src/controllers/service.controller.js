import { CatalogService } from '../services/service.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export const getServices = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const services = await CatalogService.getServices({ category, search });
  return successResponse(res, services, 'Services retrieved successfully', 200);
});

export const getServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const service = await CatalogService.getServiceById(id);
  if (!service) {
    throw new AppError('Service not found', 404);
  }
  return successResponse(res, service, 'Service details retrieved', 200);
});

