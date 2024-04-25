import { Schema, model } from "mongoose";
const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],
    totalAmount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped"],
      default: "pending",
    },
    shippingDetails: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery"],
      default: "cash_on_delivery",
    },
  },
  { timestamps: true }
);
export const Order = model("Order", orderSchema);
