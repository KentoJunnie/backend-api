const express = require('express');
const { 
    register, 
    login, 
    logout,
    verifyEmail, 
    getMe, 
    resendVerificationEmail, 
    checkEmailVerificationStatus,
    forgotPassword,
    resetPassword,
    refreshToken,
    updateProfile,
    uploadProfileImage: uploadProfileImageController,
    // OTP-based handlers
    forgotPasswordOtp,
    resetPasswordOtp,
    resendPasswordOtp
} = require('../controllers/authController');
const { 
    registerValidation, 
    loginValidation, 
    resendVerificationValidation, 
    checkVerificationValidation,
    resetPasswordValidation,
    forgotPasswordValidation,
    // OTP validators
    forgotPasswordOtpValidation,
    resetPasswordOtpValidation,
    resendPasswordOtpValidation
} = require('../middlewares/validators/authValidator');
const handleValidation = require('../middlewares/validators/handleValidation');
const { authenticate } = require('../middlewares/authMiddleware');
const uploadProfileImage = require('../middlewares/uploadProfileImage');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegistration:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - contactNumber
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         contactNumber:
 *           type: string
 *           description: User's contact number
 *         role:
 *           type: string
 *           enum: [Customer, Seller]
 *           description: User's role in the system
 *     LoginCredentials:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     UserProfile:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         contactNumber:
 *           type: string
 *         role:
 *           type: string
 *         isVerified:
 *           type: boolean
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account with email verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User registered successfully. Verification email sent.
 *       400:
 *         description: Invalid input or validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register', registerValidation, handleValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     description: Authenticate user and return JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Email not verified
 */
router.post('/login', loginValidation, handleValidation, login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Invalidate user's refresh token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticate, logout);

/**
 * @swagger
 * /api/auth/verify/{token}:
 *   get:
 *     tags: [Authentication]
 *     summary: Verify email
 *     description: Verify user's email address using verification token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify/:token', verifyEmail);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     description: Get the profile of the currently logged-in user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, getMe);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend verification email
 *     description: Resend email verification link to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       400:
 *         description: Invalid email or user already verified
 */
router.post('/resend-verification', resendVerificationValidation, handleValidation, resendVerificationEmail);

/**
 * @swagger
 * /api/auth/check-verification:
 *   post:
 *     tags: [Authentication]
 *     summary: Check email verification status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isVerified:
 *                   type: boolean
 */
router.post('/check-verification', checkVerificationValidation, handleValidation, checkEmailVerificationStatus);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 *     description: Send password reset link to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', forgotPasswordValidation, handleValidation, forgotPassword);

/**
 * @swagger
 * /api/auth/forgot-password-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset OTP
 *     description: Send a 6-digit OTP to user's email for password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent if email exists
 */
router.post('/forgot-password-otp', forgotPasswordOtpValidation, handleValidation, forgotPasswordOtp);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password
 *     description: Reset user's password using reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', resetPasswordValidation, handleValidation, resetPassword);

/**
 * @swagger
 * /api/auth/reset-password-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password using OTP
 *     description: Verify OTP and set a new password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/reset-password-otp', resetPasswordOtpValidation, handleValidation, resetPasswordOtp);

/**
 * @swagger
 * /api/auth/resend-password-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend password reset OTP
 *     description: Resend a new OTP to the user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP resent if eligible
 */
router.post('/resend-password-otp', resendPasswordOtpValidation, handleValidation, resendPasswordOtp);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Get new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     tags: [Authentication]
 *     summary: Update current user profile
 *     description: Update the profile of the currently logged-in user (name, contactNumber, profileImage)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 description: URL of the profile image
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/me', authenticate, updateProfile);

/**
 * @swagger
 * /api/auth/profile-image:
 *   post:
 *     tags: [Authentication]
 *     summary: Upload user profile image
 *     description: Upload a new profile image for the authenticated user. Returns the image URL.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded
 *       400:
 *         description: No image uploaded
 *       401:
 *         description: Unauthorized
 */
router.post('/profile-image', authenticate, uploadProfileImage.single('image'), uploadProfileImageController);

module.exports = router;
