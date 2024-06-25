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

      console.log(product);
      return {
        product: product._id,
        quantity,
        price,
        total,
      };
    })
  );

  // Calculate shipping cost based on shipping method (defaulting to 5.99 for simplicity)
  const shippingCost = 100;

  // Create new order with all the details
  const newOrder = await Order.create({
    user: user._id,
    products: productDetails, // Store the detailed product information
    totalAmount, // Total amount of the order
    status: "pending", // Initial status of the order
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
    paymentStatus: "pending", // Initial payment status
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

  // Respond with the newly created order
  return res
    .status(201)
    .json(new ApiResponse(201, newOrder, "Order created successfully"));
});
const getAllOrder = asyncHandler(async (req, res) => {
  const orders = await Order.aggregate([
    {
      $group: {
        _id: "$userId", // Group by user ID (adjust field name as necessary)
        orderCount: { $sum: 1 }, // Increment the order count for each order
        orders: { $push: "$$ROOT" }, // Push all orders to an array for this user
      },
    },
    {
      $lookup: {
        from: "users", // Collection name (adjust as necessary)
        localField: "_id", // User ID from orders
        foreignField: "_id", // User ID from users collection
        as: "userDetails", // Output field for user details
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        orderCount: 1,
        orders: 1,
        userDetails: {
          username: 1,
          email: 1,
        },
      },
    },
  ]);

  if (!orders || orders.length === 0) {
    throw new ApiError(404, "Orders not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "all order details"));
});

const getSingleOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found for this user");
  return res.status(200).json(new ApiResponse(200, order, "Your order"));
});

const updateStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw new ApiError(404, "order not found");
  order.paymentStatus = "paid";
  order.status = "delivered";
  order.orderHistory.push({ status: "delivered" });
  order.save();
  res.status(200).json(new ApiResponse(200, order, "Status Updated"));
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
  getSingleOrder,
  updateStatus,
  updateOrder,
  deleteOrder,
};
