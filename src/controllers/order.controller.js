// controllers/orderController.js

import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/product.model.js"; // Assuming you have a Product model
import { User } from "../models/user.model.js";

const createOrder = asyncHandler(async (req, res) => {
  // Destructure request body to get products and other details
  const { products, name, email, phone, street, city, notes,paymentMethod } = req.body;

  // Ensure user is authenticated
  const user = req.user;
  if (!user) throw new ApiError(401, "User not authenticated");

  // Validate required fields
  if (!products || products.length === 0) throw new ApiError(400, "Products are required");
  if ([name,email,phone,street,city].some(field=>field.trim()==="")) throw new ApiError(400, "Complete shipping details are required");

  let totalAmount = 0;

  // Map through the products array to fetch product details and calculate totals
  const productDetails = await Promise.all(products.map(async ({product:productValue,quantity }) => {

      const _id = productValue._id
    // Fetch product from database using productId
    const product = await Product.findById(_id);
    if (!product) throw new ApiError(404, `Product with ID ${_id} not found`);

    const price = product.price; 
    const total = price * quantity; 
    totalAmount += total; 

    console.log(product)
    return {
      product: product._id,
      quantity,
      price,
      total,
    };
  }));

  // Calculate shipping cost based on shipping method (defaulting to 5.99 for simplicity)
  const shippingCost = 100;

  // Create new order with all the details
  const newOrder = await Order.create({
    user:user._id,
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
    orderHistory: [{
      status: "pending", // Initial order status in history
      date: new Date(), // Date of the status update
    }],
  });

  if (!newOrder) throw new ApiError(400, "Failed to create order");
  await User.findByIdAndUpdate(user._id, { $push: { orderHistory: newOrder._id } },{new:true});


  // Respond with the newly created order
  return res.status(201).json(new ApiResponse(201, newOrder, "Order created successfully"));
});
const getAllOrder = asyncHandler(async(req,res)=>{
      const order = await Order.find()
      if(!order)throw new ApiError(404,"Order not found")
      return res.status(200).json(new ApiResponse(200,order,"all order details"))
})

const getSingleOrder = asyncHandler(async(req,res)=>{
      const {orderId} = req.params 
      const order = await Order.findOne({ _id: orderId, user: req.user._id });
      if(!order) throw new ApiError(404,"Order not found for this user")
            return res.status(200).json(new ApiResponse(200,order,"Your order"))
})
export {
  createOrder,
  getAllOrder,
  getSingleOrder
}