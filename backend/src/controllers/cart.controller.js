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

  let cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    // Create a new cart document for the user if it doesn't exist
    cart = await Cart.create({
      user: user._id,
      products: [{ product: productId }],
      totalAmount: product.price,
    });
  } else {
    // Check if the product is already in the cart
    const existingProductIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    );
    if (existingProductIndex !== -1) {
      cart.products[existingProductIndex].quantity += 1;
      cart.totalAmount += product.price;
    } else {
      cart.products.push({ product: productId });
      cart.totalAmount += product.price;
    }
    await cart.save();
  }
  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Product added to cart"));
});

const getCartDetails = asyncHandler(async (req, res) => {
  const cart = await Cart.find();
});

export { addToCart, getCartDetails };
