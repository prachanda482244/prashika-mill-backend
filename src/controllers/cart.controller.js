import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addToCart = asyncHandler(async (req, res) => {
  const user = req.user;
  const { quantity } = req.body;
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found to add in the cart");

  if (!quantity || quantity < 1) {
    throw new ApiError(400, "Quantity must be 1");
  }

  let cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    cart = new Cart({
      user: user._id,
      products: [],
    });
  }

  const existingProduct = cart.products.find(
    ({ product }) => product.toString() === productId
  );
  if (existingProduct) {
    existingProduct.quantity = quantity;
  } else {
    cart.products.push({ product: productId, quantity });
  }
  cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Product added to cart"));
});

const getCartDetails = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "products.product",
    select: "title images description price",
  });
  console.log(cart);
  if (!cart) throw new ApiError(404, "Cart not found for this user");

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "User cart fetched successfully"));
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
