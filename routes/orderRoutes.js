const express = require('express');
const router = express.Router();
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const { 
  createOrderFromCart, 
  getSellerOrders, 
  updateOrderStatus,
  getOrderDetails,
  acceptOrder,
  cancelOrder,
  createDirectOrder,
  getCustomerOrders,
  checkoutWithGCash,
  paymongoWebhook,
  uploadManualGcashProof,
  approveManualGcash,
  rejectManualGcash
} = require('../controllers/orderController');
const { 
  validateCreateOrderFromCart,
  validateCreateDirectOrder,
  validateUpdateOrderStatus,
  validateGetOrderDetails,
  validateCancelOrder,
  validateGetSellerOrders,
  validateAcceptOrder
} = require('../middlewares/validators/orderValidator');

/**
 * @swagger
 * components:
 *   schemas:
 *     DeliveryDetails:
 *       type: object
 *       required:
 *         - receiverName
 *         - contactNumber
 *         - building
 *         - roomNumber
 *       properties:
 *         receiverName:
 *           type: string
 *           description: Name of the person receiving the order
 *         contactNumber:
 *           type: string
 *           pattern: ^(\+63|0)[0-9]{10}$
 *           description: Contact number of the receiver (e.g., +639123456789)
 *         building:
 *           type: string
 *           description: Building name/number
 *         roomNumber:
 *           type: string
 *           description: Room or unit number
 *         additionalInstructions:
 *           type: string
 *           description: Additional delivery instructions
 *     OrderItem:
 *       type: object
 *       properties:
 *         product:
 *           type: string
 *           description: ID of the product
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity ordered
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Price per unit
 *         subtotal:
 *           type: number
 *           minimum: 0
 *           description: Total price for this item (quantity * price)
 *     Order:
 *       type: object
 *       properties:
 *         customer:
 *           type: string
 *           description: ID of the customer
 *         seller:
 *           type: string
 *           description: ID of the seller
 *         store:
 *           type: string
 *           description: ID of the store
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *           description: Total amount including shipping fee
 *         orderType:
 *           type: string
 *           enum: [Pickup, Delivery]
 *         shippingFee:
 *           type: number
 *           description: Delivery fee (0 for pickup orders)
 *         status:
 *           type: string
 *           enum: [Pending, Accepted, Rejected, Preparing, Ready, Out for Delivery, Ready for Pickup, Delivered, Canceled]
 *         paymentStatus:
 *           type: string
 *           enum: [Pending, Paid, Failed]
 *         paymentMethod:
 *           type: string
 *           enum: [Cash on Delivery, GCash, Cash on Pickup]
 *     CreateOrder:
 *       type: object
 *       required:
 *         - orderType
 *         - selectedItems
 *       properties:
 *         orderType:
 *           type: string
 *           enum: [Pickup, Delivery]
 *           description: Type of order
 *         selectedItems:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of product IDs to order from cart
 *           minItems: 1
 *         paymentMethod:
 *           type: string
 *           enum: [Cash on Delivery, GCash, Cash on Pickup]
 *           description: Payment method
 *         deliveryDetails:
 *           $ref: '#/components/schemas/DeliveryDetails'
 *         pickupTime:
 *           type: string
 *           format: date-time
 *           description: Required for pickup orders (must be in the future)
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Additional notes for the order
 *     UpdateOrderStatus:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [Accepted, Rejected, Preparing, Ready, Out for Delivery, Ready for Pickup, Delivered]
 *           description: New status for the order
 *         estimatedTime:
 *           type: integer
 *           description: Estimated delivery/preparation time in minutes (required for Preparing and Out for Delivery status)
 *     AcceptOrder:
 *       type: object
 *       required:
 *         - estimatedPreparationTime
 *       properties:
 *         estimatedPreparationTime:
 *           type: integer
 *           minimum: 1
 *           description: Estimated preparation time in minutes
 *         note:
 *           type: string
 *           maxLength: 500
 *           description: Optional note from the seller about the order
 *     CancelOrder:
 *       type: object
 *       properties:
 *         cancellationReason:
 *           type: string
 *           maxLength: 500
 *           description: Optional reason for cancellation
 *     DirectOrderItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           description: ID of the product to order
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity to order
 *     CreateDirectOrder:
 *       type: object
 *       required:
 *         - orderType
 *         - items
 *       properties:
 *         orderType:
 *           type: string
 *           enum: [Pickup, Delivery]
 *           description: Type of order
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DirectOrderItem'
 *           description: Array of products and quantities to order
 *           minItems: 1
 *         paymentMethod:
 *           type: string
 *           enum: [Cash on Delivery, GCash, Cash on Pickup]
 *           description: Payment method
 *         deliveryDetails:
 *           $ref: '#/components/schemas/DeliveryDetails'
 *         pickupTime:
 *           type: string
 *           format: date-time
 *           description: Required for pickup orders (must be in the future)
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Additional notes for the order
 */

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders for logged-in customer
 *     description: Retrieve all orders placed by the currently logged-in customer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           customer:
 *                             type: string
 *                           store:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               storeName:
 *                                 type: string
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 product:
 *                                   type: object
 *                                   properties:
 *                                     name:
 *                                       type: string
 *                                     price:
 *                                       type: number
 *                                     image:
 *                                       type: string
 *                                 quantity:
 *                                   type: number
 *                                 price:
 *                                   type: number
 *                           totalAmount:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [Pending, Placed, Shipped, Delivered, Canceled]
 *                           paymentStatus:
 *                             type: string
 *                             enum: [Pending, Paid, Failed]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized - User not logged in
 *       500:
 *         description: Server error
 */
router.get('/my-orders', checkRole('Customer'), getCustomerOrders);

/**
 * @swagger
 * /api/orders/create-from-cart:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order from cart items
 *     description: Creates an order from selected items in the cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrder'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input or validation error
 *       401:
 *         description: Unauthorized - User must be logged in
 */
router.post('/create-from-cart', validateCreateOrderFromCart, createOrderFromCart);

/**
 * @swagger
 * /api/orders/create-direct:
 *   post:
 *     tags: [Orders]
 *     summary: Create order directly from products
 *     description: Creates an order directly from products without using cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDirectOrder'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/create-direct', validateCreateDirectOrder, createDirectOrder);

/**
 * @swagger
 * /api/orders/seller:
 *   get:
 *     tags: [Orders]
 *     summary: Get seller's orders
 *     description: Get all orders for the authenticated seller with filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Accepted, Preparing, Ready, Out for Delivery, Ready for Pickup, Delivered, Canceled]
 *       - in: query
 *         name: orderType
 *         schema:
 *           type: string
 *           enum: [Pickup, Delivery]
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/seller', validateGetSellerOrders, checkRole('Seller'), getSellerOrders);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order details
 *     description: Get details of a specific order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:orderId', validateGetOrderDetails, getOrderDetails);

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (Seller only)
 *     description: Update the status of an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Accepted, Preparing, Ready, Out for Delivery, Ready for Pickup, Delivered]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Not authorized
 */
router.patch('/:orderId/status', validateUpdateOrderStatus, updateOrderStatus);

/**
 * @swagger
 * /api/orders/{orderId}/accept:
 *   post:
 *     tags: [Orders]
 *     summary: Accept order (Seller only)
 *     description: Accept a pending order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estimatedPreparationTime
 *             properties:
 *               estimatedPreparationTime:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized
 */
router.post('/:orderId/accept', validateAcceptOrder, acceptOrder);

/**
 * @swagger
 * /api/orders/{orderId}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel order (Customer only)
 *     description: Cancel a pending order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationReason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Cannot cancel order
 *       403:
 *         description: Not authorized
 */
router.post('/:orderId/cancel', validateCancelOrder, cancelOrder);

// GCash checkout route
router.post('/gcash/checkout', checkoutWithGCash);

// GCash webhook route
router.post('/gcash/webhook', paymongoWebhook);

// Manual GCash routes
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
// Customer upload proof
router.post('/:orderId/gcash-manual/proof', authenticate, checkRole('Customer'), upload.single('proof'), uploadManualGcashProof);
// Seller approve/reject
router.post('/:orderId/gcash-manual/approve', authenticate, checkRole('Seller'), approveManualGcash);
router.post('/:orderId/gcash-manual/reject', authenticate, checkRole('Seller'), rejectManualGcash);

module.exports = router; 