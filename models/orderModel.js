const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
});

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String,
        trim: true
    }
});

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
    items: [orderItemSchema],
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
        default: 0,
        min: 0,
        required: function() {
            return this.orderType === 'Delivery';
        }
    },
    status: {
        type: String,
        enum: [
            'Pending',           // Initial state when order is created
            'Accepted',          // Seller has accepted the order
            'Rejected',          // Seller rejected the order
            'Preparing',         // Food is being prepared
            'Ready',            // Ready for pickup or delivery
            'Out for Delivery',  // Food is being delivered (delivery only)
            'Ready for Pickup',  // Ready to be picked up (pickup only)
            'Delivered',         // Delivered or picked up
            'Canceled'           // Order was canceled
        ],
        default: 'Pending'
    },
    statusHistory: [statusHistorySchema],
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'GCash', 'Cash on Pickup', 'GCash_Manual'],
        default: function() {
            return this.orderType === 'Pickup' ? 'Cash on Pickup' : 'Cash on Delivery';
        }
    },
    paymentProof: {
        gcashRef: { type: String, trim: true },
        proofImageUrl: { type: String, trim: true },
        status: { type: String, enum: ['pending_verification', 'approved', 'rejected'], default: 'pending_verification' },
        uploadedAt: { type: Date },
        reviewedAt: { type: Date },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rejectionReason: { type: String, trim: true }
    },
    deliveryDetails: {
        receiverName: {
            type: String,
            required: function() {
                return this.orderType === 'Delivery';
            },
            trim: true
        },
        contactNumber: {
            type: String,
            required: function() {
                return this.orderType === 'Delivery';
            },
            trim: true
        },
        building: {
            type: String,
            required: function() {
                return this.orderType === 'Delivery';
            },
            trim: true
        },
        roomNumber: {
            type: String,
            required: function() {
                return this.orderType === 'Delivery';
            },
            trim: true
        },
        additionalInstructions: {
            type: String,
            trim: true
        }
    },
    pickupDetails: {
        contactNumber: {
            type: String,
            required: function() {
                return this.orderType === 'Pickup';
            },
            trim: true
        },
        pickupTime: {
            type: Date,
            required: function() {
                return this.orderType === 'Pickup';
            }
        }
    },
    estimatedDeliveryTime: {
        type: Number,
        required: function() {
            return this.orderType === 'Delivery';
        },
        min: 1
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Pre-save middleware to update status history
orderSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            note: this.notes
        });
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 