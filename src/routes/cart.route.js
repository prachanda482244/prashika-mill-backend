import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addQuantity,
  addToCart,
  clearCart,
  deleteCartItem,
  getCartDetails,
} from "../controllers/cart.controller.js";
const cartRouter = Router();

cartRouter.use(verifyJwt);

cartRouter.route("/").get(getCartDetails);
cartRouter.route("/add-to-cart/:productId").put(addToCart);
cartRouter
  .route("/delete-from-cart/:cartId/product/:productId")
  .delete(deleteCartItem);
cartRouter.route("/clear-cart").delete(clearCart);
cartRouter.route("/add-quantity").post(addQuantity);
export default cartRouter;
