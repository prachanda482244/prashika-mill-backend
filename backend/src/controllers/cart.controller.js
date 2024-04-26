import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addToCart = asyncHandler(async (req, res) => {
  const user = req.user;
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found to add in the cart");

  let cart = await Cart.findOneAndUpdate(
    { user: user._id },
    {
      $addToSet: {
        // Add the product to the cart if it's not already present
        products: { product: productId },
      },
    },
    {
      upsert: true, // Create a new cart if it doesn't exist
      new: true, // Return the updated document
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Product added to cart"));
});

const getCartDetails = asyncHandler(async (req, res) => {
  const user = req.user;
  const cart = await Cart.findOne({ user: user._id });
  if (!cart) throw new ApiError(404, "Cart not found for this user");

  const pipeline = [
    {
      $match: { _id: cart._id },
    },
    {
      $unwind: "$products",
    },
    {
      $group: {
        _id: {
          cartId: "$_id",
          productId: "$products.product",
        },
        quantity: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id.productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $addFields: {
        cartProductQuantity: "$quantity",
        totalAmount: {
          $sum: {
            $multiply: ["$productDetails.price", "$quantity"],
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id.cartId",
        totalAmount: { $sum: "$totalAmount" }, // Sum the total amounts of all products
        products: {
          $push: {
            _id: "$productDetails._id",
            title: "$productDetails.title",
            description: "$productDetails.description",
            price: "$productDetails.price",
            cartProductQuantity: "$cartProductQuantity",
          },
        },
        cartQuantity: { $sum: "$quantity" }, // Calculate total quantity in the cart
      },
    },
  ];

  const result = await Cart.aggregate(pipeline);
  if (!result || result.length === 0)
    throw new ApiError(404, "Cart details not found");

  return res
    .status(200)
    .json(new ApiResponse(200, result[0], "Cart details fetched successfully"));
});

const deleteCartItem = asyncHandler(async (req, res) => {
  const { cartId, productId } = req.params;

  // Find the cart by its ID
  let cart = await Cart.findById(cartId);
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }
  const existingItem = cart.products.find((item) => item.product == productId);
  if (!existingItem) {
    throw new ApiError(404, "Product not found in cart");
  }

  cart.products = cart.products.filter((item) => item.product != productId);

  cart = await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Item removed from cart"));
});

export { addToCart, getCartDetails, deleteCartItem };
