import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const searchProducts = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) throw new ApiError(400, "Query is needed");
  const results = await Product.find({
    $or: query
      .split(" ")
      .flatMap((word) => [
        { title: { $regex: word, $options: "i" } },
        { description: { $regex: word, $options: "i" } },
      ]),
  });

  res.status(200).json(new ApiResponse(200, results, "your search results"));
});

const searchUsers = asyncHandler(async (req, res) => {
  const { userQuery } = req.query;
  if (!userQuery) throw new ApiError(400, "Params is needed");
  const results = await User.find({
    $or: userQuery
      .split(" ")
      .map((user) => ({ username: { $regex: user, $options: "i" } })),
  });

  res.status(200).json(new ApiResponse(200, results, "user search results"));
});

export { searchProducts, searchUsers };
