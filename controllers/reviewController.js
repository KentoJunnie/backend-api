const mongoose = require('mongoose');
const Review = require('../models/reviewModel');
const Product = require('../models/productModel');

// GET /products/:productId/reviews
exports.listProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 });

    const data = reviews.map(r => ({
      id: r._id,
      productId: r.product,
      comment: r.comment,
      rating: r.rating,
      createdAt: r.createdAt,
      userName: r.user?.name || 'Anonymous',
      userImage: r.user?.profileImage || ''
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /products/:productId/reviews
exports.createProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { comment, rating } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    if (!comment || String(comment).trim().length === 0) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      comment: String(comment).trim(),
      rating: rating || undefined,
    });

    await review.populate('user', 'name profileImage');

    const data = {
      id: review._id,
      productId: review.product,
      comment: review.comment,
      rating: review.rating,
      createdAt: review.createdAt,
      userName: review.user?.name || 'Anonymous',
      userImage: review.user?.profileImage || ''
    };

    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
