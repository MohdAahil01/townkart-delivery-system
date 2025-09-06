const express = require('express');
const router = express.Router();
const { protect, authorize, isShopOwner, optionalAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
    getShops,
    getShop,
    createShop,
    updateShop,
    deleteShop,
    getMyShops,
    uploadShopImage,
    searchShops,
    getShopsByCategory,
    getNearbyShops,
    toggleShopStatus,
    updateShopRating
} = require('../controllers/shops');

// Public routes
router.get('/', optionalAuth, asyncHandler(getShops));
router.get('/search', optionalAuth, asyncHandler(searchShops));
router.get('/category/:category', optionalAuth, asyncHandler(getShopsByCategory));
router.get('/nearby', optionalAuth, asyncHandler(getNearbyShops));
router.get('/:id', optionalAuth, asyncHandler(getShop));

// Protected routes
router.use(protect);

// Shop owner routes
router.route('/')
    .post(authorize('shop_owner', 'admin'), asyncHandler(createShop));

router.route('/my-shops')
    .get(authorize('shop_owner', 'admin'), asyncHandler(getMyShops));

router.route('/:id')
    .put(authorize('shop_owner', 'admin'), asyncHandler(updateShop))
    .delete(authorize('shop_owner', 'admin'), asyncHandler(deleteShop));

router.route('/:id/image')
    .put(authorize('shop_owner', 'admin'), asyncHandler(uploadShopImage));

router.route('/:id/status')
    .put(authorize('shop_owner', 'admin'), asyncHandler(toggleShopStatus));

// Customer routes
router.route('/:id/rating')
    .post(authorize('customer'), asyncHandler(updateShopRating));

module.exports = router;
