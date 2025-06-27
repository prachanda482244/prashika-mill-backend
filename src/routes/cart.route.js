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
cartRouter.route("/p/:productId").post(addToCart).delete(deleteCartItem).put(updateCart)
cartRouter.route("/clear-cart").delete(clearCart);
export default cartRouter;
