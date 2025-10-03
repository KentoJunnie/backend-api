const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomerProfile:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         contactNumber:
 *           type: string
 */

const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const handleValidation = require('../middlewares/validators/handleValidation');

const {
  getCustomerProfile,
  getAllStoresForCustomer,
  viewStore,
  addToFavorites,
  getFavorites,
  removeFromFavorites
} = require('../controllers/customerController');

/**
 * @swagger
 * /api/customers/profile:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerProfile'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a customer
 */
router.get('/profile', authenticate, checkRole('Customer'), getCustomerProfile);

/**
 * @swagger
 * /api/customers/favorites/{productId}:
 *   post:
 *     tags: [Customers]
 *     summary: Add a product to customer's favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product added to favorites successfully
 *       400:
 *         description: Product already in favorites
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a customer
 *       404:
 *         description: Product not found
 */
router.post('/favorites/:productId', authenticate, checkRole('Customer'), addToFavorites);

/**
 * @swagger
 * /api/customers/favorites/{productId}:
 *   delete:
 *     tags: [Customers]
 *     summary: Remove a product from customer's favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed from favorites successfully
 *       400:
 *         description: Product not in favorites
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a customer
 *       404:
 *         description: User not found
 */
router.delete('/favorites/:productId', authenticate, checkRole('Customer'), removeFromFavorites);

/**
 * @swagger
 * /api/customers/favorites:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer's favorite products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 favorites:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a customer
 *       404:
 *         description: User not found
 */
router.get('/favorites', authenticate, checkRole('Customer'), getFavorites);

/**
 * @swagger
 * /api/customers/stores:
 *   get:
 *     tags: [Customers]
 *     summary: Get all stores for customer
 *     responses:
 *       200:
 *         description: List of stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 */
router.get('/stores', getAllStoresForCustomer);

/**
 * @swagger
 * /api/customers/store/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: View specific store and its products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store details with products
 *       404:
 *         description: Store not found
 */
router.get('/store/:id', viewStore);

module.exports = router;
