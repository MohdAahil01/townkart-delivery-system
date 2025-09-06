const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { user: req.user.id };
    if (unreadOnly === 'true') {
        query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('data.productId', 'name image')
        .populate('data.shopId', 'name')
        .populate('data.orderId', 'orderNumber');
    
    const total = await Notification.countDocuments(query);
    
    res.json({
        success: true,
        data: notifications,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        }
    });
}));

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', protect, asyncHandler(async (req, res) => {
    const count = await Notification.getUnreadCount(req.user.id);
    
    res.json({
        success: true,
        data: { unreadCount: count }
    });
}));

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        user: req.user.id
    });
    
    if (!notification) {
        return res.status(404).json({
            success: false,
            message: 'Notification not found'
        });
    }
    
    await notification.markAsRead();
    
    res.json({
        success: true,
        data: notification
    });
}));

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
router.put('/mark-all-read', protect, asyncHandler(async (req, res) => {
    await Notification.markAllAsRead(req.user.id);
    
    res.json({
        success: true,
        message: 'All notifications marked as read'
    });
}));

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
    });
    
    if (!notification) {
        return res.status(404).json({
            success: false,
            message: 'Notification not found'
        });
    }
    
    res.json({
        success: true,
        message: 'Notification deleted successfully'
    });
}));

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/delete-read
// @access  Private
router.delete('/delete-read', protect, asyncHandler(async (req, res) => {
    const result = await Notification.deleteMany({
        user: req.user.id,
        isRead: true
    });
    
    res.json({
        success: true,
        message: `${result.deletedCount} read notifications deleted`
    });
}));

module.exports = router;
