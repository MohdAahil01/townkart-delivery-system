const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getShopProducts,
    uploadProductImage,
    searchProducts,
    getProductsByCategory,
    updateStock,
    toggleProductStatus,
    updateProductRating
} = require('../controllers/products');

// Public routes
router.get('/', optionalAuth, asyncHandler(getProducts));
router.get('/search', optionalAuth, asyncHandler(searchProducts));
router.get('/category/:category', optionalAuth, asyncHandler(getProductsByCategory));
router.get('/shop/:shopId', optionalAuth, asyncHandler(getShopProducts));
router.get('/:id', optionalAuth, asyncHandler(getProduct));

// Protected routes
router.use(protect);

// Shop owner routes
router.route('/')
    .post(authorize('shop_owner', 'admin'), asyncHandler(createProduct));

router.route('/:id')
    .put(authorize('shop_owner', 'admin'), asyncHandler(updateProduct))
    .delete(authorize('shop_owner', 'admin'), asyncHandler(deleteProduct));

router.route('/:id/image')
    .put(authorize('shop_owner', 'admin'), asyncHandler(uploadProductImage));

router.route('/:id/stock')
    .put(authorize('shop_owner', 'admin'), asyncHandler(updateStock));

router.route('/:id/status')
    .put(authorize('shop_owner', 'admin'), asyncHandler(toggleProductStatus));

// Customer routes
router.route('/:id/rating')
    .post(authorize('customer'), asyncHandler(updateProductRating));

module.exports = router;
