import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity, quantityInKg } = req.body;
  const userId = req.user._id;

  // Validate that at least one quantity field is provided
  if (!quantity && !quantityInKg) {
    throw new ApiError(400, "Provide either quantity or quantityInKg");
  }

  // Get product with only necessary fields
  const product = await Product.findById(productId).select(
    "title price pricePerKg stock stockInKg kgPerUnit images.url"
  );

  if (!product) throw new ApiError(404, "Product not found");

  // Check stock availability based on what user is ordering
  if (quantity) {
    if (!product.stock)
      throw new ApiError(400, "Product not available by quantity");
    if (product.stock < quantity)
      throw new ApiError(400, `Only ${product.stock} units available`);
  } else if (quantityInKg) {
    if (!product.pricePerKg)
      throw new ApiError(400, "Product not available by weight");
    if (product.stockInKg < quantityInKg)
      throw new ApiError(400, `Only ${product.stockInKg}kg available`);
  }

  // Find or create cart
  let cart =
    (await Cart.findOne({ user: userId })) ||
    new Cart({ user: userId, products: [] });

  // Check if product exists in cart
  const existingItemIndex = cart.products.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingItemIndex !== -1) {
    // Update existing item - allow switching between quantity types
    if (quantity !== undefined) {
      cart.products[existingItemIndex].quantity = quantity;
      cart.products[existingItemIndex].quantityInKg = 0; // Reset kg when switching to units
    } else if (quantityInKg !== undefined) {
      cart.products[existingItemIndex].quantityInKg = quantityInKg;
      cart.products[existingItemIndex].quantity = 0; // Reset units when switching to kg
    }
  } else {
    // Add new item
    cart.products.push({
      product: productId,
      quantity: quantity || 0,
      quantityInKg: quantityInKg || 0,
    });
  }

  // Calculate total amount
  await cart.populate({
    path: "products.product",
    select: "title price pricePerKg images.url stock stockInKg",
  });

  cart.calculateTotal();
  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart updated successfully"));
});

const getCartDetails = asyncHandler(async (req, res) => {
  const existingCart = await Cart.findOne({ user: req.user.id });

  if (!existingCart) {
    return res.status(200).json(new ApiResponse(200, [], "Your cart details"));
  }

  const cart = await existingCart.populate({
    path: "products.product",
    select: "title images description price stock stockInKg pricePerKg",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Your cart fetched successfully"));
});

const updateCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity, quantityInKg } = req.body;

  // Validate that at least one quantity field is provided
  if (quantity === undefined && quantityInKg === undefined) {
    throw new ApiError(400, "Either quantity or quantityInKg must be provided");
  }

  // Validate minimum values
  if (quantity !== undefined && quantity < 0) {
    throw new ApiError(400, "Quantity cannot be negative");
  }

  if (quantityInKg !== undefined && quantityInKg < 0) {
    throw new ApiError(400, "Quantity in kg cannot be negative");
  }

  // If both are 0, remove the item
  if (
    (quantity === 0 || quantity === undefined) &&
    (quantityInKg === 0 || quantityInKg === undefined)
  ) {
    return deleteCartItem(req, res);
  }

  // Get product to check stock
  const product = await Product.findById(productId).select(
    "stock stockInKg price pricePerKg"
  );

  if (!product) throw new ApiError(404, "Product not found");

  // Check stock for the new quantities
  if (quantity !== undefined && quantity > 0) {
    if (product.stock < quantity) {
      throw new ApiError(400, `Only ${product.stock} units available`);
    }
  }

  if (quantityInKg !== undefined && quantityInKg > 0) {
    if (product.stockInKg < quantityInKg) {
      throw new ApiError(400, `Only ${product.stockInKg}kg available`);
    }
  }

  // Find cart and update the specific product
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const productIndex = cart.products.findIndex(
    (item) => item.product.toString() === productId
  );

  if (productIndex === -1) {
    throw new ApiError(404, "Product not found in cart");
  }

  // Update the quantities - allow switching between types
  if (quantity !== undefined) {
    cart.products[productIndex].quantity = quantity;
    // If user is setting quantity, reset quantityInKg to ensure only one type is active
    if (quantity > 0) {
      cart.products[productIndex].quantityInKg = 0;
    }
  }

  if (quantityInKg !== undefined) {
    cart.products[productIndex].quantityInKg = quantityInKg;
    // If user is setting quantityInKg, reset quantity to ensure only one type is active
    if (quantityInKg > 0) {
      cart.products[productIndex].quantity = 0;
    }
  }

  // Remove item if both quantities are 0
  if (
    cart.products[productIndex].quantity === 0 &&
    cart.products[productIndex].quantityInKg === 0
  ) {
    cart.products.splice(productIndex, 1);
  }

  // Calculate total amount
  await cart.populate({
    path: "products.product",
    select: "title price pricePerKg images.url stock stockInKg",
  });

  cart.calculateTotal();
  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart updated successfully"));
});

const deleteCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let cart = await Cart.findOneAndUpdate(
    { user: req.user._id, "products.product": productId },
    {
      $pull: { products: { product: productId } },
    },
    { new: true }
  ).populate({
    path: "products.product",
    select: "title images description price stock stockInKg pricePerKg",
  });

  if (!cart) throw new ApiError(404, "Cart not found");

  // Recalculate total
  cart.calculateTotal();
  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item removed from cart"));
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new ApiError(404, "Cart not found for this user");
  }

  cart.products = [];
  cart.totalAmount = 0;
  await cart.save();

  return res.status(200).json(new ApiResponse(200, cart, "Cart was cleared"));
});

export { addToCart, getCartDetails, deleteCartItem, clearCart, updateCart };
