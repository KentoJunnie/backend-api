const mongoose = require('mongoose');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const initializeCartCollection = async () => {
  try {
    const Cart = mongoose.model('Cart');
    // Drop all existing indexes
    await Cart.collection.dropIndexes();
    console.log('Successfully dropped all indexes from cart collection');
  } catch (err) {
    console.error('Error dropping indexes:', err);
  }
};

// Call this once when the server starts
initializeCartCollection();

// Helper function for consistent response structure
const createResponse = (success, message, data = null, error = null) => ({
  success,
  message,
  data,
  error
});

// Add product to cart
const addToCart = async (req, res) => {
  try {
    // Check authentication first
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {      const { productId, quantity } = req.body;

      // Input validation
      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json(createResponse(
          false,
          'Invalid input',
          null,
          'Product ID and positive quantity are required'
        ));
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json(createResponse(
          false,
          'Product not found'
        ));
      }
      
      // Stock validation
      if (product.availability === 'Out of Stock' || product.quantity < quantity) {
        return res.status(400).json(createResponse(
          false,
          'Insufficient stock',
          { available: product.quantity }
        ));
      }      const price = product.price;
      let cart = await Cart.findOne({ user: req.user._id }).session(session);

      if (!cart) {
        cart = new Cart({
          user: req.user._id,

          items: [{ 
            product: productId, 
            quantity, 
            subtotal: price * quantity 
          }],
          total: price * quantity
        });
      } else {
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
          cart.items[itemIndex].quantity = cart.items[itemIndex].quantity + quantity;
          cart.items[itemIndex].subtotal = cart.items[itemIndex].quantity * price;
        } else {
          cart.items.push({ 
            product: productId, 
            quantity, 
            subtotal: price * quantity 
          });
        }

        // Recalculate total
        cart.total = cart.items.reduce((acc, item) => acc + item.subtotal, 0);
      }

      await cart.save({ session });
      await session.commitTransaction();
      
      await cart.populate('items.product');
      res.status(200).json(createResponse(
        true,
        'Product added to cart',
        { cart }
      ));
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json(createResponse(
      false,
      'Failed to add to cart',
      null,
      err.message
    ));
  }
};

// View cart
const viewCart = async (req, res) => {
  try {
    // Check authentication first
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      return res.status(200).json(createResponse(
        true,
        'Cart is empty',
        {
          user: req.user._id,
          items: [],
          total: 0
        }
      ));
    }

    res.status(200).json(createResponse(
      true,
      'Cart retrieved successfully',
      { cart }
    ));
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json(createResponse(
      false,
      'Failed to fetch cart',
      null,
      err.message
    ));
  }
};

const removeItemFromCart = async (req, res) => {
  try {
    // Check authentication first
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user._id;
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json(createResponse(
          false,
          'Product ID is required'
        ));
      }

      let cart = await Cart.findOne({ user: userId }).session(session);

      if (!cart) {
        return res.status(200).json(createResponse(
          true,
          'Cart is empty',
          {
            user: userId,
            items: [],
            total: 0
          }
        ));
      }

      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        const item = cart.items[itemIndex];
        cart.total -= item.subtotal;
        cart.items.splice(itemIndex, 1);
      } else {
        return res.status(200).json(createResponse(
          true,
          'Item not in cart',
          { cart }
        ));
      }

      await cart.save({ session });
      await session.commitTransaction();

      res.status(200).json(createResponse(
        true,
        'Item removed from cart',
        { cart }
      ));
    } catch (err) {
      await session.abortTransaction();
      console.error('Error removing item from cart:', err);
      res.status(500).json(createResponse(
        false,
        'Failed to remove item from cart',
        null,
        err.message
      ));
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Error in removeItemFromCart:', err);
    res.status(500).json(createResponse(
      false,
      'An unexpected error occurred',
      null,
      err.message
    ));
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    // Check authentication first
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user._id;
      let cart = await Cart.findOne({ user: userId }).session(session);

      if (!cart) {
        return res.status(200).json(createResponse(
          true,
          'Cart is already empty',
          {
            user: userId,
            items: [],
            total: 0
          }
        ));
      }

      cart.items = [];
      cart.total = 0;

      await cart.save({ session });
      await session.commitTransaction();

      res.status(200).json(createResponse(
        true,
        'Cart cleared successfully',
        { cart }
      ));
    } catch (err) {
      await session.abortTransaction();
      console.error('Error clearing cart:', err);
      res.status(500).json(createResponse(
        false,
        'Failed to clear cart',
        null,
        err.message
      ));
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Error in clearCart:', err);
    res.status(500).json(createResponse(
      false,
      'An unexpected error occurred',
      null,
      err.message
    ));
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    // Check authentication first
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user._id;
      const { productId, quantity } = req.body;

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json(createResponse(
          false,
          'Product ID and valid quantity are required'
        ));
      }

      let cart = await Cart.findOne({ user: userId }).session(session);
      if (!cart) {
        return res.status(200).json(createResponse(
          true,
          'Cart is empty',
          {
            user: userId,
            items: [],
            total: 0
          }
        ));
      }

      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
      if (itemIndex === -1) {
        return res.status(200).json(createResponse(
          true,
          'Item not found in cart',
          { cart }
        ));
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json(createResponse(
          false,
          'Product not found'
        ));
      }

      // Check stock
      if (product.quantity < quantity) {
        return res.status(400).json(createResponse(
          false,
          'Insufficient stock',
          { available: product.quantity }
        ));
      }

      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].subtotal = product.price * quantity;
      cart.total = cart.items.reduce((acc, item) => acc + item.subtotal, 0);

      await cart.save({ session });
      await session.commitTransaction();

      res.status(200).json(createResponse(
        true,
        'Cart item updated successfully',
        { cart }
      ));
    } catch (err) {
      await session.abortTransaction();
      console.error('Error updating cart item:', err);
      res.status(500).json(createResponse(
        false,
        'Failed to update item in cart',
        null,
        err.message
      ));
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Error in updateCartItem:', err);
    res.status(500).json(createResponse(
      false,
      'An unexpected error occurred',
      null,
      err.message
    ));
  }
};

// Get cart summary (total items and total amount)
const getCartSummary = async (req, res) => {
  try {
    // Check authentication first
    if (!req.user || !req.user._id) {
      return res.status(401).json(createResponse(
        false,
        'Authentication required',
        null,
        'User must be logged in to perform this action'
      ));
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      return res.status(200).json({ 
        totalItems: 0, 
        totalAmount: 0 
      });
    }

    const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    const totalAmount = cart.total;

    res.status(200).json({ totalItems, totalAmount });
  } catch (err) {
    console.error('Error in getCartSummary:', err);
    res.status(500).json(createResponse(
      false,
      'An unexpected error occurred',
      null,
      err.message
    ));
  }
};

module.exports = {
  addToCart,
  viewCart,
  removeItemFromCart,
  clearCart,
  updateCartItem,
  getCartSummary
};