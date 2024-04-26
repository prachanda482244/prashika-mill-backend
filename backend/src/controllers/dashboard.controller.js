import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllDetailsCount = asyncHandler(async (req, res) => {
  const totalProductCount = await Product.countDocuments();
  const totalUserCount = await User.countDocuments();

  const data = {
    totalProducts: totalProductCount,
    totalCustomer: totalUserCount,
    todaySales: 0,
    monthlySales: 0,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Total number of users"));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const allUser = await User.find().sort({ createdAt: -1 });
  if (!allUser) throw new ApiError(404, "Not found");
  return res
    .status(200)
    .json(new ApiResponse(200, allUser, "Details of all users"));
});

const getAllProducts = asyncHandler(async (_, res) => {
  const allProduct = await Product.find().sort({ createdAt: -1 });
  if (!allProduct) throw new ApiError(404, "Product not found");
  return res
    .status(200)
    .json(new ApiResponse(200, allProduct, "All product details"));
});
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw new ApiError(404, "User not found");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});
export { getAllDetailsCount, getAllUsers, getAllProducts, deleteUser };
