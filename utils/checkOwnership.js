const Store = require('../models/storeModel');
const StoreMember = require('../models/storeMemberModel');

const checkStoreOwnership = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    console.log('Authenticated User ID:', req.user._id); // Log the user ID
    console.log('Store Owner ID:', store.owner.toString()); // Log the store owner ID

    // Allow access for owner or active store members (Owner/Manager/Staff)
    const isOwner = store.owner.toString() === req.user._id.toString();
    let isMember = false;
    if (!isOwner) {
      const membership = await StoreMember.findOne({ store: store._id, user: req.user._id, status: 'Active' });
      isMember = Boolean(membership);
    }

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Not authorized to access this store' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Ownership check failed', error: error.message });
  }
};


module.exports = checkStoreOwnership;
