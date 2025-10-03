const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

// Helper function to validate results
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// Validate create order from cart
const validateCreateOrderFromCart = [
  body('orderType')
    .trim()
    .notEmpty()
    .withMessage('Order type is required')
    .isIn(['Pickup', 'Delivery'])
    .withMessage('Order type must be either Pickup or Delivery'),

  body('selectedItems')
    .isArray()
    .withMessage('Selected items must be an array')
    .notEmpty()
    .withMessage('At least one item must be selected'),

  body('selectedItems.*')
    .isMongoId()
    .withMessage('Invalid product ID format'),

  body('paymentMethod')
    .optional()
    .trim()
    .isIn(['Cash on Delivery', 'Cash on Pickup', 'GCash', 'GCash_Manual'])
    .withMessage('Invalid payment method'),

  // Delivery details validation
  body('deliveryDetails')
    .if(body('orderType').equals('Delivery'))
    .notEmpty()
    .withMessage('Delivery details are required for delivery orders'),

  body('deliveryDetails.receiverName')
    .if(body('orderType').equals('Delivery'))
    .trim()
    .notEmpty()
    .withMessage('Receiver name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Receiver name must be between 2 and 50 characters'),

  body('deliveryDetails.contactNumber')
    .if(body('orderType').equals('Delivery'))
    .trim()
    .notEmpty()
    .withMessage('Contact number is required')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage('Invalid contact number format'),

  body('deliveryDetails.building')
    .if(body('orderType').equals('Delivery'))
    .trim()
    .notEmpty()
    .withMessage('Building information is required'),

  body('deliveryDetails.roomNumber')
    .if(body('orderType').equals('Delivery'))
    .trim()
    .notEmpty()
    .withMessage('Room number is required'),

  // Pickup details validation
  body('pickupDetails')
    .if(body('orderType').equals('Pickup'))
    .notEmpty()
    .withMessage('Pickup details are required for pickup orders'),

  body('pickupDetails.contactNumber')
    .if(body('orderType').equals('Pickup'))
    .trim()
    .notEmpty()
    .withMessage('Contact number is required')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage('Invalid contact number format'),

  body('pickupDetails.pickupTime')
    .if(body('orderType').equals('Pickup'))
    .notEmpty()
    .withMessage('Pickup time is required for pickup orders')
    .isISO8601()
    .withMessage('Invalid pickup time format')
    .custom((value) => {
      const pickupTime = new Date(value);
      const now = new Date();
      if (pickupTime <= now) {
        throw new Error('Pickup time must be in the future');
      }
      return true;
    }),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),

  validateResults
];

// Validate create direct order
const validateCreateDirectOrder = [
  body('orderType')
    .trim()
    .notEmpty()
    .withMessage('Order type is required')
    .isIn(['Pickup', 'Delivery'])
    .withMessage('Order type must be either Pickup or Delivery'),

  body('items')
    .isArray()
    .withMessage('Items must be an array')
    .notEmpty()
    .withMessage('At least one item must be selected'),

  body('items.*.productId')
    .isMongoId()
    .withMessage('Invalid product ID format'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  // Reuse delivery and pickup validations
  ...validateCreateOrderFromCart.filter(validator => 
    validator.builder?.fields?.[0]?.startsWith('deliveryDetails') ||
    validator.builder?.fields?.[0] === 'pickupDetails' ||
    validator.builder?.fields?.[0] === 'paymentMethod' ||
    validator.builder?.fields?.[0] === 'notes'
  ),

  validateResults
];

// Validate update order status
const validateUpdateOrderStatus = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID format'),

  body('status')
    .if((value, { req }) => !req.body.paymentStatus)
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Ready for Pickup', 'Delivered', 'Rejected'])
    .withMessage('Invalid status'),

  body('paymentStatus')
    .optional()
    .isIn(['Pending', 'Paid', 'Failed'])
    .withMessage('Invalid payment status'),

  body('estimatedTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Estimated time must be a positive number'),

  validateResults
];

// Validate get order details
const validateGetOrderDetails = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID format'),

  validateResults
];

// Validate cancel order
const validateCancelOrder = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID format'),

  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Cancellation reason must be between 10 and 500 characters'),

  validateResults
];

// Validate get seller orders
const validateGetSellerOrders = [
  query('status')
    .optional()
    .isIn(['Pending', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Ready for Pickup', 'Delivered', 'Rejected', 'Canceled'])
    .withMessage('Invalid status'),

  query('orderType')
    .optional()
    .isIn(['Pickup', 'Delivery'])
    .withMessage('Invalid order type'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      if (req.query.startDate && new Date(endDate) <= new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'totalAmount', 'status'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  validateResults
];

// Validate accept order
const validateAcceptOrder = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID format'),

  body('estimatedPreparationTime')
    .isInt({ min: 1 })
    .withMessage('Estimated preparation time must be a positive number'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters'),

  validateResults
];

module.exports = {
  validateCreateOrderFromCart,
  validateCreateDirectOrder,
  validateUpdateOrderStatus,
  validateGetOrderDetails,
  validateCancelOrder,
  validateGetSellerOrders,
  validateAcceptOrder
}; 