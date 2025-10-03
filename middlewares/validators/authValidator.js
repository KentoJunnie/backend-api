const { body } = require('express-validator');

const registerValidation = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),

    body('email')
        .isEmail().withMessage('Please enter a valid email'),

    body('contactNumber')
        .notEmpty().withMessage('Contact number is required')
        // Accept common international or local numeric formats (7-15 digits, optional leading + or leading 0)
        .matches(/^(\+?\d{7,15}|0\d{9,12})$/)
        .withMessage('Invalid contact number. Use digits only, optionally starting with + or 0.'),

    body('password')
        .isLength({ min: 8, max: 8 }).withMessage('Password must be exactly 8 characters long')
        .matches(/\d/).withMessage('Password must contain a number')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter'),

    body('role')
        .optional()
        .isIn(['Customer', 'Seller']).withMessage('Invalid role'),
];

const loginValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email'),

    body('password')
        .notEmpty().withMessage('Password is required'),
];

const resendVerificationValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email')
        .notEmpty().withMessage('Email is required'),
];

const checkVerificationValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email')
        .notEmpty().withMessage('Email is required'),
];

const forgotPasswordValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email')
        .notEmpty().withMessage('Email is required'),
];

const resetPasswordValidation = [
    body('token')
        .notEmpty().withMessage('Reset token is required'),
    body('newPassword')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/\d/).withMessage('Password must contain a number')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
];

// OTP-based password reset validators
const forgotPasswordOtpValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email')
        .notEmpty().withMessage('Email is required'),
];

const resetPasswordOtpValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email')
        .notEmpty().withMessage('Email is required'),
    body('otp')
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
        .isNumeric().withMessage('OTP must be numeric'),
    body('newPassword')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/\d/).withMessage('Password must contain a number')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter'),
];

const resendPasswordOtpValidation = [
    body('email')
        .isEmail().withMessage('Please enter a valid email')
        .notEmpty().withMessage('Email is required'),
];

module.exports = {
    registerValidation,
    loginValidation,
    resendVerificationValidation,
    checkVerificationValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    forgotPasswordOtpValidation,
    resetPasswordOtpValidation,
    resendPasswordOtpValidation
};
