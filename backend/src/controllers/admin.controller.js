import { cookieOptions } from "../config/constants.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { generateAccessAndRefreshTokens } from "../utils/generateAccessAndRefreshToken.js";

const registerAdmin = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All admin field required");
  }
  const existedAdmin = await User.findOne({ email });

  if (existedAdmin) throw new ApiError(404, "Admin already exists");

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(404, "Avatar not found");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) throw new ApiError(404, "Avatar missing");

  const admin = await User.create({
    username,
    email,
    password,
    avatar: avatar.url,
    role: "admin",
  });

  const registeredAdmin = await User.findById(admin._id).select(
    "-password -refreshToken"
  );

  res.status(201).json(new ApiResponse(201, registeredAdmin, "Admin created"));
});

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!(email || password)) throw new ApiError(400, "All field required");

  const existedUser = await User.findOne({ email });
  if (!existedUser) throw new ApiError(404, "User not found");

  const isValidPassword = await existedUser.isPasswordCorrect(password);
  if (!isValidPassword) throw new ApiError(400, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    existedUser?._id
  );
  const loggedInUser = await User.findById(existedUser._id).select(
    "-password -refreshToken"
  );
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, loggedInUser, "Admin logged in"));
});
export { registerAdmin, adminLogin };
