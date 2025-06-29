import { Router } from "express";
import { createReview, deleteReview, editReview, getProductReview } from "../controllers/review.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const reviewRouter = Router()
reviewRouter.use(verifyJwt)

reviewRouter.route("/:id")
      .get(getProductReview)
      .put(editReview)
      .delete(deleteReview);
reviewRouter.route("/").post(createReview)
export { reviewRouter }