const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middlewares/authMiddleware');
const { listProductReviews, createProductReview } = require('../controllers/reviewController');

// Public: list reviews for a product
router.get('/products/:productId/reviews', listProductReviews);

// Authenticated: create a review for a product
router.post('/products/:productId/reviews', authenticate, createProductReview);

module.exports = router;
