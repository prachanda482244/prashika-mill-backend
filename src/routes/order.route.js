import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  createOrder,
  deleteOrder,
  getSingleOrder,
  getUserOrder,
  updateOrder,
} from "../controllers/order.controller.js";
const orderRouter = Router();

orderRouter.use(verifyJwt);
orderRouter.route("/")
  .post(createOrder)
  .get(getUserOrder)
orderRouter.route("/:orderId").get(getSingleOrder);
orderRouter.route("/update-order/:orderId").patch(updateOrder);
orderRouter.route("/delete-order/:orderId").delete(deleteOrder);
export default orderRouter;
