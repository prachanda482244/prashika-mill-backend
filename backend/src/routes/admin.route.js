import { Router } from "express";
import { adminLogin } from "../controllers/admin.controller.js";
const adminRouter = Router();

adminRouter.route("/login").post(adminLogin);
export default adminRouter;
