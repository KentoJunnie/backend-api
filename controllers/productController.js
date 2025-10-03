const Product = require('../models/productModel');
const Store = require('../models/storeModel');
const Order = require('../models/orderModel');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const fs = require('fs').promises;  // Use fs.promises for cleaner async file handling

// Utility function for file deletion
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error('Error deleting file:', err);
  }
};

// Create a product
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, availability, estimatedTime, shippingFee } = req.body;
    const sellerId = req.user._id;

    // Find the store associated with the seller
    const store = await Store.findOne({ owner: sellerId });
    if (!store) return res.status(404).json({ message: 'Store not found' });

    let imageUrl;

    // Check if file is uploaded
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path, 'product-images');
      imageUrl = result.secure_url;

      // Delete the file from local storage after upload
      await deleteFile(req.file.path);
    } else {
      // If no image is uploaded, set the default image
      imageUrl = Product.schema.path('image').defaultValue;
    }

    // Create the product with shipping and time info
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      availability,
      sellerId,
      storeId: store._id,  // Ensure the storeId is correctly referenced
      image: imageUrl, // Set the image URL (either uploaded or default)
      estimatedTime: estimatedTime || 30, // Default 30 minutes if not provided
      shippingFee: shippingFee || 0 // Default 0 if not provided
    });

    // Save the product and update the store with the new product
    const savedProduct = await newProduct.save();
    store.products.push(savedProduct._id);
    await store.save();

    res.status(201).json(savedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all products for a seller
const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const products = await Product.find({ sellerId })
      .populate('storeId', 'storeName')
      .populate('sellerId', 'name email');

    res.status(200).json(products); // Directly sending the products array
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch seller products' });
  }
};

// Get all products (public route)
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('storeId', 'storeName')
      .populate('sellerId', 'name email');

    // Aggregate sales stats per product from orders delivered
    const stats = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $unwind: '$items' },
      {
        $project: {
          product: '$items.product',
          quantity: '$items.quantity',
          hour: { $hour: '$createdAt' }
        }
      },
      { $group: { _id: { product: '$product', hour: '$hour' }, qty: { $sum: '$quantity' } } },
      {
        $group: {
          _id: '$_id.product',
          totalSold: { $sum: '$qty' },
          hours: { $push: { hour: '$_id.hour', qty: '$qty' } }
        }
      }
    ]);

    const statsMap = new Map();
    for (const s of stats) {
      const hours = Array.isArray(s.hours) ? s.hours : [];
      let maxQty = 0;
      for (const h of hours) {
        if (h.qty > maxQty) maxQty = h.qty;
      }
      const peakHours = hours.filter(h => h.qty === maxQty).map(h => h.hour).sort((a, b) => a - b);
      statsMap.set(String(s._id), {
        soldCount: s.totalSold || 0,
        peakOrderTimes: peakHours
      });
    }

    const productsWithStats = products.map(p => {
      const obj = p.toObject();
      const stat = statsMap.get(String(p._id));
      obj.soldCount = stat ? stat.soldCount : 0;
      obj.peakOrderTimes = stat ? stat.peakOrderTimes : [];
      return obj;
    });

    res.json(productsWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('storeId', 'storeName')
      .populate('sellerId', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Attach stats for single product
    const stats = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $unwind: '$items' },
      { $match: { 'items.product': product._id } },
      {
        $project: {
          quantity: '$items.quantity',
          hour: { $hour: '$createdAt' }
        }
      },
      { $group: { _id: '$hour', qty: { $sum: '$quantity' } } },
      { $sort: { _id: 1 } }
    ]);

    let soldCount = 0;
    let maxQty = 0;
    for (const s of stats) {
      soldCount += s.qty || 0;
      if (s.qty > maxQty) maxQty = s.qty;
    }
    const peakOrderTimes = stats.filter(s => s.qty === maxQty).map(s => s._id);

    const result = product.toObject();
    result.soldCount = soldCount;
    result.peakOrderTimes = peakOrderTimes;
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only allow updating specific fields
    const updates = {};
    const allowedUpdates = ['name', 'description', 'price', 'category', 'availability', 'estimatedTime', 'shippingFee'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle image upload if file is present
    if (req.file) {
      updates.image = req.file.path;
    }

    // Update the product with the allowed fields
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update product image only
const updateProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check ownership
    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload new image to Cloudinary
    const result = await uploadToCloudinary(req.file.path, 'product-images');
    
    // Delete the local file after upload
    await deleteFile(req.file.path);

    // Only update the image URL, keeping all other fields unchanged
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { image: result.secure_url },
      { new: true }
    );

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Product.findByIdAndDelete(req.params.id);
    await Store.findByIdAndUpdate(product.storeId, {
      $pull: { products: product._id },
    });

    return res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteAllProductsInStore = async (req, res) => {
  try {
    const storeId = req.params.storeId;

    // Find the store by ID
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Remove all products related to the store
    await Product.deleteMany({ storeId: storeId });

    // Clear the products array in the store model
    store.products = [];
    await store.save();

    res.status(200).json({ message: 'All products deleted from store' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createProduct,
  getSellerProducts,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  deleteAllProductsInStore,
  updateProductImage,

};
