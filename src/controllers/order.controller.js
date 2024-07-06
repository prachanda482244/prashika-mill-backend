// controllers/orderController.js

import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/product.model.js"; // Assuming you have a Product model
import { User } from "../models/user.model.js";

const createOrder = asyncHandler(async (req, res) => {
  // Destructure request body to get products and other details
  const { products, name, email, phone, street, city, notes, paymentMethod } =
    req.body;

  // Ensure user is authenticated
  const user = req.user;
  if (!user) throw new ApiError(401, "User not authenticated");

  // Validate required fields
  if (!products || products.length === 0)
    throw new ApiError(400, "Products are required");
  if ([name, email, phone, street, city].some((field) => field.trim() === ""))
    throw new ApiError(400, "Complete shipping details are required");

  let totalAmount = 0;
  const shippingCost = 100;

  // Map through the products array to fetch product details and calculate totals
  const productDetails = await Promise.all(
    products.map(async ({ product: productValue, quantity }) => {
      const _id = productValue._id;
      // Fetch product from database using productId
      const product = await Product.findById(_id);
      if (!product) throw new ApiError(404, `Product with ID ${_id} not found`);

      const price = product.price;
      const total = price * quantity;
      totalAmount += total;

      return {
        product: product._id,
        quantity,
        price,
        total,
      };
    })
  );

  const newOrder = await Order.create({
    user: user._id,
    products: productDetails,
    totalAmount: totalAmount + shippingCost,
    status: "pending",
    shippingDetails: {
      name,
      email,
      phone,
      address: {
        street,
        city,
      },
      shippingCost, // Shipping cost for the order
    },
    paymentMethod: "cash_on_delivery", // Payment method for the order
    paymentStatus: "unpaid", // Initial payment status
    notes: notes || "", // Additional notes from the user
    orderHistory: [
      {
        status: "pending", // Initial order status in history
        date: new Date(), // Date of the status update
      },
    ],
  });

  if (!newOrder) throw new ApiError(400, "Failed to create order");
  await User.findByIdAndUpdate(
    user._id,
    { $push: { orderHistory: newOrder._id } },
    { new: true }
  );

  return res
    .status(201)
    .json(new ApiResponse(201, newOrder, "Order created successfully"));
});
const getAllOrder = asyncHandler(async (_, res) => {
  const order = await Order.find()
    .populate("products.product")
    .sort({ createdAt: -1 });
  if (!order) throw new ApiError(404, "Order not found");

  const userOrder = order?.map((order) => {
    return {
      _id: order._id,
      name: order.shippingDetails.name,
      address: [
        order.shippingDetails.address.city,
        order.shippingDetails.address.street,
      ],
      date: order.createdAt,
      totalPrice: order.totalAmount,
      paymentStatus: order.paymentStatus,
      status: order.status,
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, userOrder, "All product details"));
});

const getUserOrder = asyncHandler(async (req, res) => {
  const order = await Order.find({ user: req.user._id })
    .populate("products.product")
    .select(" -orderHistory -paymentMethod ");
  if (!order) throw new ApiError(404, "Order not found for this user");
  return res
    .status(200)
    .json(new ApiResponse(200, order, "User order fetched "));
});
const getSingleOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId)
    .populate("products.product user")
    .select("-orderHistory ");
  if (!order) throw new ApiError(404, "Order not found");

  const userOrder = {
    _id: order._id,
    name: order.shippingDetails.name,
    email: order.shippingDetails.email,
    phone: order.shippingDetails.phone,
    imageUrl: order.user.avatar,
    address: `${order.shippingDetails.address.city} ${order.shippingDetails.address.street}`,
    product: order.products.map((_product) => {
      return {
        productTitle: _product.product.title,
        productImage: _product.product.images[0].url,
        productDescription: _product.product.description,
        productPrice: _product.product.price,
        productQuantity: _product.quantity,
      };
    }),
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    notes: order.notes,
    status: order.status,
    shippingCost: order.shippingDetails.shippingCost,
    createdAt: order.createdAt,
  };
  return res.status(200).json(new ApiResponse(200, userOrder, "User order"));
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId }).select(
    " -products  -notes "
  );
  if (!order) throw new ApiError(404, "order not found");
  order.status = status;
  order.status === "delivered"
    ? (order.paymentStatus = "paid")
    : (order.paymentStatus = "unpaid");
  order.orderHistory.push({ status: status });
  order.save();
  res.status(200).json(new ApiResponse(200, order, "Order Status Updated"));
});

const updateOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { phone, street, city } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");

  order.shippingDetails.phone = phone;
  order.shippingDetails.address.street = street;
  order.shippingDetails.address.city = city;
  order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order update successfully"));
});

const deleteOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findByIdAndDelete(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Order delete successfully"));
});
export {
  createOrder,
  getAllOrder,
  getUserOrder,
  updateStatus,
  updateOrder,
  deleteOrder,
  getSingleOrder,
};
