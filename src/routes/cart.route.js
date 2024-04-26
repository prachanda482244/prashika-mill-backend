import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addToCart,
  deleteCartItem,
  getCartDetails,
} from "../controllers/cart.controller.js";
const cartRouter = Router();

cartRouter.use(verifyJwt);

cartRouter.route("/").get(getCartDetails);
cartRouter.route("/add-to-cart/:productId").post(addToCart);
cartRouter
  .route("/delete-from-cart/:cartId/product/:productId")
  .delete(deleteCartItem);
export default cartRouter;
