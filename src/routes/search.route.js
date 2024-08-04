import { Router } from "express";
import { searchProducts } from "../controllers/search.controller.js";
const searchRouter = Router();
searchRouter.route("/products").post(searchProducts);
export default searchRouter;
