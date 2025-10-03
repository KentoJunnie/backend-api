const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const handleValidation = require('./handleValidation');

// Create and initialize rate limiter middleware
const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many cart operations. Please try again later.'
  }
});

// Validation for adding a product to the cart
const addToCartValidator = [  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive number'),
  handleValidation
];

// Validation for updating cart item
const updateCartValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive number'),
  handleValidation
];

// Validation for removing cart item
const removeItemValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  handleValidation
];

module.exports = {
  cartLimiter,
  addToCartValidator,
  updateCartValidator,
  removeItemValidator
};