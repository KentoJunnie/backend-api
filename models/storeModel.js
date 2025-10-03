const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    storeName: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // One store per seller
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    }],
    image: {
        type: String,
        default: 'https://res.cloudinary.com/dflcnd7z3/image/upload/v1743873916/store-images/defaultStore.png'
    },
    bannerImage: {
        type: String,
        default: 'https://res.cloudinary.com/dflcnd7z3/image/upload/v1745655986/icrooeomu8t1tigzwgio.png'
    },
    // Manual GCash details for offline payments
    gcashName: {
        type: String,
        trim: true,
        default: ''
    },
    gcashNumber: {
        type: String,
        trim: true,
        default: ''
    },
    gcashQrUrl: {
        type: String,
        trim: true,
        default: ''
    }
}, { timestamps: true });

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
