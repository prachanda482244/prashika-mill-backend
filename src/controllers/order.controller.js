// controllers/orderController.js

import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/product.model.js"; // Assuming you have a Product model
import { Cart } from "../models/cart.model.js";
import { User } from "../models/user.model.js";

const createOrder = asyncHandler(async (req, res) => {
  const { city, phone, notes, street } = req.body;

  if (!city || !phone || !street) {
    throw new ApiError(400, "Shipping details are missing");
  }

  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId }).populate('user products.product');

  if (!cart || cart.products.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }


  let totalAmount = 0;
  const shippingCost = 100;
  const orderItems = [];

  for (const item of cart.products) {
    const product = item.product;
    const quantity = item.quantity

    const quantityInKg = item.quantityInKg
    // Check stock
    if (quantity && product.stock < quantity) {
      throw new ApiError(400, `Only ${product.stock} units available`);
    }
    if (quantityInKg && product.stockInKg < quantityInKg) {
      throw new ApiError(400, `Only ${product.stockInKg}kg available`);

    }

    // Calculate price based on whether it's by quantity or weight
    const price = item.quantity ?
      product.price * item.quantity :
      product.pricePerKg * item.quantityInKg;

    totalAmount += price;

    orderItems.push({
      product: product._id,
      quantity,
      quantityInKg,
      price
    });
  }

  const order = await Order.create({
    user: userId,
    products: orderItems,
    totalAmount: totalAmount + shippingCost,
    status: "pending",
    shippingDetails: {
      city,
      email: cart.user.email,
      phone,
      name: cart.user.username,
      street,
      shippingCost
    },
    notes,
  });

  // Update product stocks
  for (const item of cart.products) {

    const quantity = item.quantity; // ordered quantity in units
    const quantityInKg = item.quantityInKg; // ordered quantity in kg
    const kgPerUnit = item.product.kgPerUnit
    const updateFields = {};

    if (quantity !== 0) {
      const calculatedKg = quantity * kgPerUnit;
      updateFields.stock = -quantity;
      updateFields.stockInKg = -calculatedKg;
    }
    if (quantityInKg !== 0) {
      const calculatedQuantity = Math.floor(quantityInKg / kgPerUnit);
      updateFields.stock = -calculatedQuantity;
      updateFields.stockInKg = -quantityInKg;
    }
    if (Object.keys(updateFields).length > 0) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: updateFields
      });
    }

  }

  // Clear the cart
  await Cart.findByIdAndDelete(cart._id);
  await User.findByIdAndUpdate(userId, {
    $push: {
      orderHistory: order?._id
    }
  },
    { new: true })
  return res
    .status(201)
    .json(new ApiResponse(201, { orderId: order._id }, "Order created successfully"));
});
const getAllOrder = asyncHandler(async (_, res) => {
  // 1. Query with only necessary fields and lean() for faster processing
  const orders = await Order.find()
    .select('_id shippingDetails totalAmount paymentStatus status createdAt')
    .populate({
      path: 'products.product',
      select: 'name price' // Only get essential product fields
    })
    .sort({ createdAt: -1 }) // Recent orders first
    .lean(); // Convert to plain JS objects for faster processing

  if (!orders.length) {
    throw new ApiError(404, "No orders found");
  }

  // 2. Transform data efficiently
  const formattedOrders = orders.map(order => ({
    _id: order._id,
    name: order.shippingDetails.name,
    address: `${order.shippingDetails.city}, ${order.shippingDetails.street}`,
    date: order.createdAt,
    totalPrice: order.totalAmount,
    paymentStatus: order.paymentStatus,
    status: order.status,
    productCount: order.products.length // Added useful field
  }));

  // 3. Cache the response for future requests (optional)
  // await cache.set('all_orders', formattedOrders, 60); // Cache for 60 seconds

  return res.status(200).json(
    new ApiResponse(200, formattedOrders, "All orders retrieved successfully")
  );
});
const getUserOrder = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .select('-paymentMethod -shippingDetails.shippingCost -__v -updatedAt')
    .populate({
      path: 'products.product',
      select: 'name price images'
    })
    .lean(); // Convert to plain JS object for faster processing

  if (!orders.length) {
    throw new ApiError(404, "No orders found for this user");
  }

  return res.status(200).json(
    new ApiResponse(200, orders, "User orders fetched successfully")
  );
});
const getSingleOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Validate orderId format first

  // Optimized query with selective field population
  const order = await Order.findById(orderId)
    .populate([
      {
        path: 'products.product',
        select: 'title images description price pricePerKg', // Only necessary fields
        transform: (product) => ({
          title: product?.title,
          image: product?.images?.[0]?.url || null,
          description: product?.description,
          price: product?.price
        })
      },
      {
        path: 'user',
        select: 'avatar' // Only need avatar from user
      }
    ])
    .select('-__v -updatedAt -orderHistory') // Exclude unnecessary fields
    .lean(); // Convert to plain JS object for performance

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Format the response data
  const formattedOrder = {
    _id: order._id,
    customer: {
      name: order.shippingDetails.name,
      email: order.shippingDetails.email,
      phone: order.shippingDetails.phone,
      imageUrl: order.user?.avatar || null // Handle potential missing avatar
    },
    shipping: {
      address: `${order.shippingDetails.street}, ${order.shippingDetails.city}`,
      cost: order.shippingDetails.shippingCost
    },
    products: order.products.map(item => ({
      title: item.product?.title || 'Product not available',
      image: item.product?.image || null,
      price: item.price, // Using the price at time of order (from products array)
      quantity: item.quantity,
      quantityInKg: item.quantityInKg,
    })),
    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
      total: order.totalAmount
    },
    orderDetails: {
      status: order.status,
      notes: order.notes || 'No additional notes',
      createdAt: order.createdAt
    }
  };

  return res.status(200).json(
    new ApiResponse(200, formattedOrder, "Order details retrieved successfully")
  );
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { orderId } = req.params;
  const order = await Order.findOne({ _id: orderId }).select(
    " -products -notes "
  );
  if (!order) throw new ApiError(404, "order not found");
  order.status = status;
  if (order.status === "delivered") {
    order.paymentStatus = "paid"
    order.deliveredAt = new Date()
  } else {
    order.paymentStatus = "unpaid"
  }
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
