const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Store:
 *       type: object
 *       required:
 *         - storeName
 *       properties:
 *         storeName:
 *           type: string
 *           description: Name of the store
 *         description:
 *           type: string
 *           description: Store description
 *         image:
 *           type: string
 *           format: binary
 *           description: Store profile image
 *         bannerImage:
 *           type: string
 *           format: binary
 *           description: Store banner image
 *         owner:
 *           type: string
 *           description: Store owner's user ID
 */

const {
  updateStore,
  deleteStore,
  getAllStores,
  getStoreById,
  getStoreProducts,
  getMyStore
} = require('../controllers/storeController');

const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const checkStoreOwnership = require('../utils/checkOwnership');
const uploadStoreImage = require('../middlewares/uploadStoreMiddleware'); 
const { cache } = require('../utils/cacheConfig');

// Safe multer wrapper to surface upload errors clearly
const uploadStoreFields = uploadStoreImage.fields([
  { name: 'image', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
  { name: 'gcashQr', maxCount: 1 }
]);

const safeUpload = (req, res, next) => {
  uploadStoreFields(req, res, (err) => {
    if (err) {
      console.error(`[Store Upload][${req.id}] Multer error:`, err);
      return res.status(400).json({
        message: 'File upload error',
        error: err.message || 'Failed to process uploaded files'
      });
    }
    next();
  });
};

/**
 * @swagger
 * /api/store:
 *   get:
 *     tags: [Stores]
 *     summary: Get all stores
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search stores by name
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
router.get('/', cache('15 minutes'), getAllStores);

/**
 * @swagger
 * /api/store/my-store:
 *   get:
 *     tags: [Stores]
 *     summary: Get store by logged-in owner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a seller
 */
router.get(
  '/my-store',
  authenticate,
  checkRole('Seller'),
  getMyStore
);

/**
 * @swagger
 * /api/store/view/{id}:
 *   get:
 *     tags: [Stores]
 *     summary: View store details and products
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
router.get('/view/:id', cache('15 minutes'), getStoreById);

/**
 * @swagger
 * /api/store/{id}/products:
 *   get:
 *     tags: [Stores]
 *     summary: Get all products in a store
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products in the store
 *       404:
 *         description: Store not found
 */
router.get('/:id/products', cache('15 minutes'), getStoreProducts);

/**
 * @swagger
 * /api/store/{id}:
 *   put:
 *     tags: [Stores]
 *     summary: Update store
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
router.put('/:id', 
  authenticate, 
  checkStoreOwnership, 
  safeUpload,
  updateStore
);

/**
 * @swagger
 * /api/store/{id}:
 *   delete:
 *     tags: [Stores]
 *     summary: Delete store
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
router.delete('/:id', authenticate, checkStoreOwnership, deleteStore);

module.exports = router;
