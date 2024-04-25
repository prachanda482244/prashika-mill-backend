import { Schema, model } from "mongoose";
const adminSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      lowercase: true,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Admin = model("Admin", adminSchema);
