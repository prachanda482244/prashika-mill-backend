import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
      product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
      },
      user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
      },
      rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
      },
      comment: {
            type: String,
            required: true,
            trim: true
      },
      createdAt: {
            type: Date,
            default: Date.now
      }
}, {
      timestamps: true
});

// Add compound index to ensure one review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema)