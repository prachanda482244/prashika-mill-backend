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
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "Cart not found for this user");

  const pipeline = [
    {
      $match: {
        _id: cart._id,
      },
    },
    {
      $unwind: "$products",
    },
    {
      $lookup: {
        from: "products",
        localField: "products.product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $group: {
        _id: "$productDetails._id",
        cartQuantity: { $sum: 1 },
        product: { $first: "$productDetails" },
      },
    },
    {
      $addFields: {
        totalCartAmout: { $sum: "$productDetails.price" },
      },
    },
    {
      $project: {
        _id: 0,
        cartQuantity: 1,
        quantity: 1,
        product: 1,
        totalPrice: { $multiply: ["$cartQuantity", "$product.price"] },
        product: {
          images: 1,
          title: 1,
          description: 1,
          price: 1,
        },
      },
    },
  ];
  const aggregate = await Cart.aggregate(pipeline);

  if (!aggregate) throw new ApiError(400, "Something went wrong");
  return res
    .status(200)
    .json(new ApiResponse(200, aggregate, "User cart fetched successfully"));
});

const addQuantity = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  console.log(quantity);
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

const clearCart = asyncHandler(async (req, res) => {
  const cartItem = await Cart.findOne({ user: req.user._id });
  if (!cartItem) {
    throw new ApiError(404, "Cart item not found for this user");
  }
  cartItem.products = [];
  cartItem.save();
  return res
    .status(200)
    .json(new ApiResponse(200, cartItem.products, "Cart was cleared"));
});
export { addToCart, getCartDetails, deleteCartItem, clearCart, addQuantity };
