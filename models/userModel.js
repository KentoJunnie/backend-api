const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    verificationToken: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ['Customer', 'Seller'],
        default: 'Customer',
    },
    store: {
        storeName: String,
        storeId: mongoose.Schema.Types.ObjectId,
        owner: mongoose.Schema.Types.ObjectId,
    },
    refreshToken: {
        type: String
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    // OTP-based password reset fields
    passwordResetOTP: {
        type: String, // store hashed otp
    },
    passwordResetOTPExpires: {
        type: Date,
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    profileImage: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Add method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

// Add method to generate an OTP for password reset
userSchema.methods.createPasswordResetOTP = function() {
    // Generate a 6-digit numeric OTP as string with leading zeros if needed
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    // Hash the OTP before storing
    this.passwordResetOTP = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');
    this.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return otp;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
