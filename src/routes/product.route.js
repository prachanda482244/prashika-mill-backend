import { Router } from "express";
import {
  getAllProducts,
  getSearchProducts,
  getSingleProduct,
} from "../controllers/product.controller.js";

const productRouter = Router();

productRouter.route("/").get(getAllProducts);
productRouter.route("/search").get(getSearchProducts);
productRouter.route("/:id").get(getSingleProduct);

export default productRouter;
