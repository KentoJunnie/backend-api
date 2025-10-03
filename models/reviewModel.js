const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    comment: {
      type: String,
      trim: true,
      required: true,
      maxlength: 1000,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

// Ensure a user can only post one review per product (optional but helpful)
reviewSchema.index({ product: 1, user: 1 }, { unique: false });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
