import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity, quantityInKg } = req.body;
  const userId = req.user._id;

  // Validate input - must have exactly one of quantity or quantityInKg
  if (!quantity && !quantityInKg) {
    throw new ApiError(400, "Provide either quantity or quantityInKg");
  }
  if (quantity && quantityInKg) {
    throw new ApiError(400, "Cannot provide both quantity and quantityInKg");
  }

  // Get product with only necessary fields
  const product = await Product.findById(productId)
    .select('title price pricePerKg stock stockInKg kgPerUnit images.url');

  if (!product) throw new ApiError(404, "Product not found");

  // Check stock availability
  if (quantity) {
    if (!product.stock) throw new ApiError(400, "Product not available by quantity");
    if (product.stock < quantity) throw new ApiError(400, `Only ${product.stock} units available`);
  } else {
    if (!product.pricePerKg) throw new ApiError(400, "Product not available by weight");
    if (product.stockInKg < quantityInKg) throw new ApiError(400, `Only ${product.stockInKg}kg available`);
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: userId }) ||
    new Cart({ user: userId, products: [] });

  // Check if product exists in cart
  const existingItemIndex = cart.products.findIndex(item =>
    item.product.toString() === productId
  );

  if (existingItemIndex !== -1) {
    // Update existing item - only allow one type per product
    if (quantity) {
      cart.products[existingItemIndex] = {
        product: productId,
        quantity,
        quantityInKg: 0 // Remove kg if switching to quantity
      };
    } else {
      cart.products[existingItemIndex] = {
        product: productId,
        quantityInKg,
        quantity: 0 // Remove quantity if switching to kg
      };
    }
  } else {
    // Add new item
    cart.products.push({
      product: productId,
      ...(quantity ? { quantity } : { quantityInKg })
    });
  }

  // Calculate total amount
  await cart.populate({
    path: 'products.product',
    select: 'title price pricePerKg images.url stock stockInKg'
  });

  cart.totalAmount = cart.products.reduce((total, item) => {
    if (item.quantity > 0) {
      return total + (item.quantity * item.product.price);
    } else {
      return total + (item.quantityInKg * item.product.pricePerKg);
    }
  }, 0);

  await cart.save();

  return res.status(200).json(
    new ApiResponse(200, cart, "Cart updated successfully")
  );
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
  ).populate({
    path: "products.product",
    select: "title images description price stock stockInKg pricePerKg",
  });

  if (!cart) throw new ApiError(404, "Cart not found");
  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item removed from cart"));
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
