import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addToCart, getCartDetails } from "../controllers/cart.controller.js";
const cartRouter = Router();

cartRouter.use(verifyJwt);

cartRouter.route("/").get(getCartDetails);
cartRouter.route("/add-to-cart/:productId").post(addToCart);
export default cartRouter;
