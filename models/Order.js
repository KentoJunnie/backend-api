const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    orderType: {
        type: String,
        enum: ['Pickup', 'Delivery'],
        required: true
    },
    shippingFee: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Preparing', 'Ready', 'Out for Delivery', 'Ready for Pickup', 'Delivered', 'Canceled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'GCash', 'Cash on Pickup'],
        required: true
    },
    deliveryDetails: {
        receiverName: String,
        contactNumber: String,
        building: String,
        roomNumber: String,
        additionalInstructions: String
    },
    pickupTime: {
        type: Date
    },
    estimatedDeliveryTime: {
        type: Number // in minutes
    },
    estimatedPreparationTime: {
        type: Number // in minutes
    },
    notes: String,
    sellerNotes: String,
    cancellationReason: String,
    canceledBy: {
        type: String,
        enum: ['Customer', 'Seller']
    },
    acceptedAt: Date,
    canceledAt: Date,
    deliveredAt: Date
}, {
    timestamps: true
});

// Add indexes for better query performance
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ store: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 