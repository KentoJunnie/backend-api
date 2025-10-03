const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SellerProfile:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         contactNumber:
 *           type: string
 *         store:
 *           type: object
 *           properties:
 *             storeName:
 *               type: string
 *             storeId:
 *               type: string
 */

// Middleware
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const upload = require('../utils/multerStorage');

// Controllers
const { getSellerProfile } = require('../controllers/sellerController');
const {
  createProduct,
  getSellerProducts,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const {
  updateStore,
  deleteStore,
  getStoreByOwner
} = require('../controllers/storeController');

/**
 * @swagger
 * /api/seller/profile:
 *   get:
 *     tags: [Sellers]
 *     summary: Get seller profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerProfile'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a seller
 */
router.get('/profile', authenticate, checkRole('Seller'), getSellerProfile);

/**
 * @swagger
 * /api/seller/store:
 *   get:
 *     tags: [Sellers]
 *     summary: Get seller's store
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a seller
 */
router.get('/store', authenticate, checkRole('Seller'), getStoreByOwner);

/**
 * @swagger
 * /api/seller/store/{id}:
 *   put:
 *     tags: [Sellers]
 *     summary: Update seller's store
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Store'
 *     responses:
 *       200:
 *         description: Store updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not store owner
 */
router.put('/store/:id', authenticate, checkRole('Seller'), updateStore);

/**
 * @swagger
 * /api/seller/store/{id}:
 *   delete:
 *     tags: [Sellers]
 *     summary: Delete seller's store
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not store owner
 */
router.delete('/store/:id', authenticate, checkRole('Seller'), deleteStore);

/**
 * @swagger
 * /api/seller/products:
 *   post:
 *     tags: [Sellers]
 *     summary: Create a product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a seller
 */
router.post(
  '/products',
  authenticate,
  checkRole('Seller'),
  upload.single('image'),
  createProduct
);

/**
 * @swagger
 * /api/seller/products:
 *   get:
 *     tags: [Sellers]
 *     summary: Get all products by seller
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller's products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a seller
 */
router.get('/products', authenticate, checkRole('Seller'), getSellerProducts);

/**
 * @swagger
 * /api/seller/products/{id}:
 *   patch:
 *     tags: [Sellers]
 *     summary: Update product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not product owner
 */
router.patch(
  '/products/:id',
  authenticate,
  checkRole('Seller'),
  upload.single('image'),
  updateProduct
);

/**
 * @swagger
 * /api/seller/products/{id}:
 *   delete:
 *     tags: [Sellers]
 *     summary: Delete product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not product owner
 */
router.delete('/products/:id', authenticate, checkRole('Seller'), deleteProduct);

module.exports = router;
