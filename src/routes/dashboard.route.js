import { Router } from "express";
import { authorizeAdmin, verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getAllDetailsCount,
  getAllProducts,
  getAllUsers,
  deleteUser,
} from "../controllers/dashboard.controller.js";
const dashboardRouter = Router();

dashboardRouter.use(verifyJwt);
dashboardRouter.use(authorizeAdmin);

dashboardRouter.route("/").get(getAllDetailsCount);
dashboardRouter.route("/get-all-users").get(getAllUsers);
dashboardRouter.route("/get-all-products").get(getAllProducts);
dashboardRouter.route("/delete-user/:userId").delete(deleteUser);
export default dashboardRouter;
