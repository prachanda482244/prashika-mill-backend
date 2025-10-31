import { Schema, model } from "mongoose";
const cartSchema = new Schema(
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
        quantity: {
          type: Number,
          default: 0,
        },
        quantityInKg: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
    },
  },
  { timestamps: true }
);
cartSchema.methods.calculateTotal = function () {
  this.totalAmount = this.products.reduce((total, item) => {
    if (item.quantity > 0) {
      return total + item.quantity * item.product.price;
    } else {
      return total + item.quantityInKg * item.product.pricePerKg;
    }
  }, 0);
  return this.totalAmount;
};
export const Cart = model("Cart", cartSchema);
