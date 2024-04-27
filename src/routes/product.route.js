import { Router } from "express";
import {
  getAllProducts,
  getSingleProduct,
} from "../controllers/product.controller.js";

const productRouter = Router();

productRouter.route("/get-all-products").get(getAllProducts);
productRouter.route("/get-single-product/:id").get(getSingleProduct);

export default productRouter;
