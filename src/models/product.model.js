import { Schema, model } from "mongoose";
const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true, // Price per unit
    },
    pricePerKg: {
      type: Number, // Price per kg (optional)
    },
    stock: {
      type: Number, // Total units available
    },
    quantityWeight: {
      type: Number
    },
    stockInKg: {
      type: Number, // Total kg available
    },
    kgPerUnit: {
      type: Number,
      default: 50, // 1 quantity = 50kg
    },
  },
  { timestamps: true }
);
export const Product = model("Product", productSchema);
