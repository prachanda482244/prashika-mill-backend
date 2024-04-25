import { Schema, model } from "mongoose";
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    orderHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
