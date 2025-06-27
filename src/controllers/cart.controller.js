import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addToCart = asyncHandler(async (req, res) => {
  const user = req.user;
  const { productId } = req.params;
  const { quantity } = req.body
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  let cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    const newCart = await Cart.create({
      user: user._id,
      products: [{ product: productId, quantity: quantity || 1 }],
    });
    return res
      .status(201)
      .json(new ApiResponse(201, newCart, "Product added to cart"));
  }

  const existingProduct = cart.products.find(
    ({ product }) => product.toString() === productId
  );
  if (existingProduct) {
    existingProduct.quantity += quantity || 1;
  } else {
    cart.products.push({ product: productId, quantity: quantity || 1 });
  }
  cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Product added to cart"));
});

const getCartDetails = asyncHandler(async (req, res) => {
  const existingCart = await Cart.findOne({ user: req.user.id });

  if (!existingCart) {
    return res.status(200).json(new ApiResponse(200, [], "Your cart details"));
  }
  const cart = await existingCart.populate({
    path: "products.product",
    select: "title images description price",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Your cart fetched successfully"));
});

const updateCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) throw new ApiError(400, "Quantity must be at least 1");
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id, "products.product": productId },
    { $set: { "products.$.quantity": quantity } },
    { new: true }
  );

  if (!cart) throw new ApiError(404, "Cart or product not found");
  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart Updated Successfully"));
});

const deleteCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id, "products.product": productId },
    {
      $pull: { products: { product: productId } },
    },
    { new: true }
  );

  if (!cart) throw new ApiError(404, "Cart not found");
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
export { addToCart, getCartDetails, deleteCartItem, clearCart, updateCart };
