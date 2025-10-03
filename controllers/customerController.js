const Store = require('../models/storeModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');

const getCustomerProfile = async (req, res) => {
  try {
    res.status(200).json({
      message: 'Customer profile fetched successfully',
      user: req.user,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer profile', details: err.message });
  }
};

const getAllStoresForCustomer = async (req, res) => {
  try {
    const stores = await Store.find().populate('owner', 'name email');
    res.status(200).json(stores);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stores', details: err.message });
  }
};

const viewStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('products');
    if (!store) return res.status(404).json({ error: 'Store not found' });

    res.status(200).json(store);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch store', details: err.message });
  }
};

const addToFavorites = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Find user and update favorites
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if product is already in favorites
    if (user.favorites && user.favorites.includes(productId)) {
      return res.status(400).json({ message: 'Product already in favorites' });
    }

    // Add to favorites
    if (!user.favorites) {
      user.favorites = [];
    }
    user.favorites.push(productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product added to favorites successfully',
      favorites: user.favorites
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to favorites', details: err.message });
  }
};

const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;    // Find user and populate favorites with product details
    const user = await User.findById(userId).populate({
      path: 'favorites',
      select: 'name price description image availability category storeId',
      populate: {
        path: 'storeId',
        select: 'storeName'
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      favorites: user.favorites || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get favorites', details: err.message });
  }
};

const removeFromFavorites = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    // Find user and update favorites
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if product is in favorites
    if (!user.favorites || !user.favorites.includes(productId)) {
      return res.status(400).json({ message: 'Product not in favorites' });
    }

    // Remove from favorites
    user.favorites = user.favorites.filter(id => id.toString() !== productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from favorites successfully',
      favorites: user.favorites
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from favorites', details: err.message });
  }
};

module.exports = {
  getCustomerProfile,
  getAllStoresForCustomer,
  viewStore,
  addToFavorites,
  getFavorites,
  removeFromFavorites,
};
