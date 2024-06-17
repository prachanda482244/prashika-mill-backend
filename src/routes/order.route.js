import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createOrder, getAllOrder, getSingleOrder } from "../controllers/order.controller.js";
const orderRouter = Router()

orderRouter.use(verifyJwt)
orderRouter.route("/").get(getAllOrder)
orderRouter.route("/get-single-order/:orderId").get(getSingleOrder)
orderRouter.route("/create-order").post(createOrder)
export default orderRouter