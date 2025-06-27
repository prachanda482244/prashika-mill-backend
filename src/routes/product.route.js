import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getSingleProduct,
} from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authorizeAdmin, verifyJwt } from "../middlewares/auth.middleware.js";

const productRouter = Router();
productRouter.route("/").post(upload.array("image"), verifyJwt, authorizeAdmin, createProduct)
productRouter.route("/").get(getAllProducts);
productRouter.route("/:id").get(getSingleProduct);

export default productRouter;
