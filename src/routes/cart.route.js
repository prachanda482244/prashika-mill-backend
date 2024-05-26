import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addToCart,
  clearCart,
  deleteCartItem,
  getCartDetails,
  updateCart,
} from "../controllers/cart.controller.js";
const cartRouter = Router();

cartRouter.use(verifyJwt);

cartRouter.route("/").get(getCartDetails);
cartRouter.route("/add-to-cart/:productId").post(addToCart);
cartRouter.route("/delete-cart/:productId").delete(deleteCartItem);
cartRouter.route("/clear-cart").delete(clearCart);
cartRouter.route("/update-cart/:productId").put(updateCart);
export default cartRouter;
