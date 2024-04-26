import { Schema, model } from "mongoose";
const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      required: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],

    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const Product = model("Product", productSchema);
