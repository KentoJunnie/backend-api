const Product = require('../models/productModel');
const StoreMember = require('../models/storeMemberModel');

const checkProductOwnership = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const isProductOwner = product.sellerId.toString() === req.user._id.toString();
    let isStoreMember = false;
    if (!isProductOwner) {
      const membership = await StoreMember.findOne({ store: product.storeId, user: req.user._id, status: 'Active' });
      isStoreMember = Boolean(membership);
    }

    if (!isProductOwner && !isStoreMember) {
      return res.status(403).json({ message: 'Not authorized to modify this product' });
    }

    // Optionally attach product to request for reuse in controller
    req.product = product;

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ownership check failed' });
  }
};

module.exports = checkProductOwnership;
