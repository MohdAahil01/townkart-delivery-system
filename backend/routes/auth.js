const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
    register,
    login,
    logout,
    getMe,
    updateDetails,
    updatePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification
} = require('../controllers/auth');

// Public routes
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/logout', asyncHandler(logout));
router.post('/forgotpassword', asyncHandler(forgotPassword));
router.put('/resetpassword/:resettoken', asyncHandler(resetPassword));
router.get('/verify/:verificationtoken', asyncHandler(verifyEmail));
router.post('/resend-verification', asyncHandler(resendVerification));

// Protected routes
router.use(protect);
router.get('/me', asyncHandler(getMe));
router.put('/updatedetails', asyncHandler(updateDetails));
router.put('/updatepassword', asyncHandler(updatePassword));

module.exports = router;
