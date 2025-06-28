import { Schema, model } from "mongoose";


const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
        },
        quantityInKg: {
          type: Number,

        },
        price: {
          type: Number,
          required: true,
        },

      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "delivered", "cancelled"],
      default: "pending",
    },
    shippingDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      shippingCost: {
        type: Number,
        required: true,
        default: 100,
      },
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery"],
      default: "cash_on_delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    deliveredAt: {
      type: Date
    },

  },
  { timestamps: true }
);

export const Order = model("Order", orderSchema);
