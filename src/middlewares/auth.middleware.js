import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");
    if (!token) throw new ApiError(404, "Token not found");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new ApiError(401, "Unauthorized user");
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(400, "Authentication error: " + error);
  }
});

export const authorizeAdmin = asyncHandler(async (req, res, next) => {
  try {
    const user = req?.user;
    if (!user) throw new ApiError(401, "Unauthorized user");

    if (user?.role !== "admin") {
      throw new ApiError(400, "User is not authorized as admin");
    }
    next();
  } catch (error) {
    throw new ApiError(400, "Authorize admin error:- " + error);
  }
});
