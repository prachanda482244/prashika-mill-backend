import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createOrder, deleteOrder, getAllOrder, getSingleOrder, updateOrder, updateStatus } from "../controllers/order.controller.js";
const orderRouter = Router()

orderRouter.use(verifyJwt)
orderRouter.route("/").get(getAllOrder)
orderRouter.route("/get-single-order/:orderId").get(getSingleOrder)
orderRouter.route("/create-order").post(createOrder)
orderRouter.route("/:orderId/update-status").patch(updateStatus)
orderRouter.route("/update-order/:orderId").patch(updateOrder)
orderRouter.route("/delete-order/:orderId").delete(deleteOrder)
export default orderRouter