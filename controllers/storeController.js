// /controllers/storeController.js
const Store = require('../models/storeModel');
const StoreMember = require('../models/storeMemberModel');

// Create store for seller (used during registration)
const createStoreForSeller = async (user) => {
  const storeName = `${user.name}'s Store`;
  const newStore = new Store({
    storeName,
    owner: user._id,
    products: [],
    image: 'https://res.cloudinary.com/dflcnd7z3/image/upload/v1743873916/store-images/defaultStore.png',
  });

  await newStore.save();
  // Ensure owner membership exists
  await StoreMember.findOneAndUpdate(
    { store: newStore._id, user: user._id },
    { role: 'Owner', status: 'Active' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return newStore;
};

const updateStore = async (req, res) => {
  const storeId = req.params.id;
  const updates = {};
  // Temporary diagnostic logging
  try {
    console.log(`[Store Update][${req.id}] Incoming update for store:`, storeId);
    console.log(`[Store Update][${req.id}] Body keys:`, Object.keys(req.body || {}));
    if (req.files) {
      console.log(`[Store Update][${req.id}] File fields:`, Object.keys(req.files));
      console.log(`[Store Update][${req.id}] image?`, Boolean(req.files['image']));
      console.log(`[Store Update][${req.id}] bannerImage?`, Boolean(req.files['bannerImage']));
      console.log(`[Store Update][${req.id}] gcashQr?`, Boolean(req.files['gcashQr']));
    } else {
      console.log(`[Store Update][${req.id}] No files attached`);
    }
  } catch (logErr) {
    // Swallow logging errors to avoid affecting request flow
  }

  if (req.body.storeName) {
    updates.storeName = req.body.storeName;
  }

  // Optional manual GCash fields
  if (typeof req.body.gcashName === 'string') {
    updates.gcashName = req.body.gcashName;
  }
  if (typeof req.body.gcashNumber === 'string') {
    updates.gcashNumber = req.body.gcashNumber;
  }

  // If files are present, ensure Cloudinary is configured to avoid opaque 500s
  const filesPresent = req.files && (req.files['image'] || req.files['bannerImage'] || req.files['gcashQr']);
  if (filesPresent) {
    const missing = [];
    if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
    if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
    if (missing.length) {
      console.error(`[Store Update][${req.id}] Missing Cloudinary env vars: ${missing.join(', ')}`);
      return res.status(500).json({
        message: 'Cloudinary is not configured on the server',
        error: `Missing env vars: ${missing.join(', ')}`
      });
    }
  }

  if (req.files) {
    if (req.files['image']) {
      updates.image = req.files['image'][0].path;
    }
    if (req.files['bannerImage']) {
      updates.bannerImage = req.files['bannerImage'][0].path;
    }
    // Accept optional GCash QR upload via field name 'gcashQr'
    if (req.files['gcashQr']) {
      updates.gcashQrUrl = req.files['gcashQr'][0].path;
    }
  }

  try {
    const updatedStore = await Store.findByIdAndUpdate(storeId, updates, { new: true });

    if (!updatedStore) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.status(200).json(updatedStore);
  } catch (error) {
    console.error(`[Store Update][${req.id}] Error updating store ${storeId}:`, error && error.stack ? error.stack : error);
    res.status(500).json({ message: 'Failed to update store', error: error.message });
  }
};

// Delete store
const deleteStore = async (req, res) => {
  const storeId = req.params.id;

  try {
    const deletedStore = await Store.findByIdAndDelete(storeId);
    if (!deletedStore) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.status(200).json({ message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete store', error: error.message });
  }
};

// Get store by owner ID
const getStoreByOwner = async (req, res) => {
  const ownerId = req.params.ownerId;

  try {
    const store = await Store.findOne({ owner: ownerId }).populate('products');
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch store', error: error.message });
  }
};

const getMyStore = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id }).populate('products');
    if (!store) {
      return res.status(404).json({ message: 'Store not found for this seller' });
    }
    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your store', error: error.message });
  }
};

// Get all stores (for customers)
const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find().populate('owner', 'name email');
    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stores', error: error.message });
  }
};

// Get single store by ID (for customers)
const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('products');
      
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get store', error: error.message });
  }
};

// Get products by store ID (for customers)
const getStoreProducts = async (req, res) => {
  const storeId = req.params.id;

  try {
    const store = await Store.findById(storeId).populate('products');
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.status(200).json({
      storeId: store._id,
      storeName: store.storeName,
      products: store.products,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products for the store', error: error.message });
  }
};

module.exports = {
  createStoreForSeller,
  updateStore,
  deleteStore,
  getStoreByOwner,
  getAllStores,
  getStoreById, 
  getStoreProducts,
  getMyStore,
};