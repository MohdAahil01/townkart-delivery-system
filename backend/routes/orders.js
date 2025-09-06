const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
    getOrders,
    getOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getMyOrders,
    getShopOrders,
    getOrderStats,
    rateOrder
} = require('../controllers/orders');

// All routes are protected
router.use(protect);

// Customer routes
router.route('/')
    .get(authorize('customer'), asyncHandler(getMyOrders))
    .post(authorize('customer'), asyncHandler(createOrder));

router.route('/:id')
    .get(authorize('customer', 'shop_owner', 'admin'), asyncHandler(getOrder));

router.route('/:id/cancel')
    .put(authorize('customer'), asyncHandler(cancelOrder));

router.route('/:id/rate')
    .post(authorize('customer'), asyncHandler(rateOrder));

// Shop owner routes
router.route('/shop/orders')
    .get(authorize('shop_owner', 'admin'), asyncHandler(getShopOrders));

router.route('/shop/stats')
    .get(authorize('shop_owner', 'admin'), asyncHandler(getOrderStats));

router.route('/:id/status')
    .put(authorize('shop_owner', 'admin'), asyncHandler(updateOrderStatus));

// Admin routes
router.route('/admin/all')
    .get(authorize('admin'), asyncHandler(getOrders));

module.exports = router;
