import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createReview = asyncHandler(async (req, res) => {
      const { product: productId } = req.body;
      const userId = req.user._id;
      const product = await Product.findById(productId);
      if (!product) {
            throw new ApiError(400, `No product with id: ${productId}`);
      }
      const alreadyReviewed = await Review.findOne({
            product: productId,
            user: userId
      });

      if (alreadyReviewed) {
            throw new ApiError(400, 'You have already reviewed this product');
      }
      const review = await Review.create({ ...req.body, user: userId });
      res.status(200).json(new ApiResponse(200, review, "Review added."))
})

const getProductReview = asyncHandler(async (req, res) => {
      const { id: productId } = req.params;

      const reviews = await Review.find({ product: productId })
            .populate('user', 'username avatar')
            .sort('-createdAt');


      const averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
      const data = {
            count: reviews.length,
            averageRating: averageRating.toFixed(1),
            reviews
      }
      return res.status(200).json(new ApiResponse(200, data, "Reviews fetched"))
})
const editReview = asyncHandler(async (req, res) => {
      const { id: reviewId } = req.params;
      const userId = req.user._id;
      const { rating, comment } = req.body;

      // Validate input
      if (!rating && !comment) {
            throw new ApiError(400, 'At least one field (rating or comment) is required to update');
      }

      // Find the review
      const review = await Review.findById(reviewId);

      if (!review) {
            throw new ApiError(404, `No review found with id: ${reviewId}`);
      }

      // Check if the user is the owner of the review
      if (review.user.toString() !== userId.toString()) {
            throw new ApiError(403, 'You are not authorized to edit this review');
      }

      // Update the review
      if (rating) review.rating = rating;
      if (comment) review.comment = comment;

      const updatedReview = await review.save();

      return res.status(200).json(
            new ApiResponse(200, updatedReview, "Review updated successfully")
      );
});

const deleteReview = asyncHandler(async (req, res) => {
      const { id: reviewId } = req.params;
      const userId = req.user._id;

      // Find the review
      const review = await Review.findById(reviewId);

      if (!review) {
            throw new ApiError(404, `No review found with id: ${reviewId}`);
      }

      // Check if the user is the owner of the review or an admin
      if (review.user.toString() !== userId.toString()) {
            throw new ApiError(403, 'You are not authorized to delete this review');
      }

      await Review.findByIdAndDelete(reviewId);

      return res.status(200).json(
            new ApiResponse(200, null, "Review deleted successfully")
      );
});
export {
      createReview,
      getProductReview,
      editReview,
      deleteReview
}