import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createOrder, getAllOrder, getSingleOrder, updateStatus } from "../controllers/order.controller.js";
const orderRouter = Router()

orderRouter.use(verifyJwt)
orderRouter.route("/").get(getAllOrder)
orderRouter.route("/get-single-order/:orderId").get(getSingleOrder)
orderRouter.route("/create-order").post(createOrder)
orderRouter.route("/:orderId/update-status").patch(updateStatus)
export default orderRouter