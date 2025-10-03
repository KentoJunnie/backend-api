const { body, param } = require('express-validator');

const createProductValidation = [
  // Validate name: not empty and string length between 3 and 50 characters
  body('name')
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Product name must be between 3 and 50 characters'),

  // Validate description: not empty and length between 10 and 500 characters
  body('description')
    .notEmpty().withMessage('Product description is required')
    .isLength({ min: 10, max: 500 }).withMessage('Product description must be between 10 and 500 characters'),

  // Validate price: must be a valid float greater than 0
  body('price')
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),

  // Validate category: not empty
  body('category')
    .notEmpty().withMessage('Product category is required'),

  // Validate availability: must be one of "Available" or "Out of Stock"
  body('availability')
    .isIn(['Available', 'Out of Stock']).withMessage('Availability must be either "Available" or "Out of Stock"'),

  // Optionally validate image if provided (check if URL format is valid)
  body('image')
    .optional()
    .isURL().withMessage('Image must be a valid URL'),

  // Validate estimatedTime: must be a positive number
  body('estimatedTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Estimated time must be a positive number in minutes'),

  // Validate shippingFee: must be a non-negative number
  body('shippingFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping fee must be a non-negative number'),
];

const updateProductValidation = [
  // Validate name if provided
  body('name')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Product name must be between 3 and 50 characters')
    .trim(),

  // Validate description if provided
  body('description')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Product description must be between 10 and 500 characters')
    .trim(),

  // Validate price if provided
  body('price')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number'),

  // Validate category if provided
  body('category')
    .optional()
    .notEmpty()
    .withMessage('Category cannot be empty if provided')
    .trim(),

  // Validate availability if provided
  body('availability')
    .optional()
    .isIn(['Available', 'Out of Stock'])
    .withMessage('Availability must be either "Available" or "Out of Stock"'),

  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),

  // Validate estimatedTime if provided
  body('estimatedTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Estimated time must be a positive number in minutes'),

  // Validate shippingFee if provided
  body('shippingFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping fee must be a non-negative number'),
];

module.exports = { 
    createProductValidation,
    updateProductValidation 
};
