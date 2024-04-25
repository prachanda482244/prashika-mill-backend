import { ApiError } from "../utils/ApiErrors";
import { asyncHandler } from "../utils/asyncHandler.js";

export const adminAuth = asyncHandler(async (req, _, next) => {
  try {
    if (req?.user || req?.user?.role !== "admin") {
      throw new ApiError(403, "Access forbidden! Admin authorization required");
    }
    next();
  } catch (error) {
    throw new ApiError(400, "Error" + error);
  }
});
