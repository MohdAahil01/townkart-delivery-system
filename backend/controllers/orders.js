const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private (Admin)
exports.getOrders = async (req, res, next) => {
    const { page = 1, limit = 20, status, shop } = req.query;
    
    const query = {};
    
    if (status) {
        query.status = status;
    }
    
    if (shop) {
        query.shop = shop;
    }
    
    const orders = await Order.find(query)
        .populate('user', 'name email phone')
        .populate('shop', 'name location')
        .populate('items.product', 'name price image')
        .sort('-createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    
    res.json({
        success: true,
        data: orders,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        }
    });
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email phone address')
        .populate('shop', 'name location phone email')
        .populate('items.product', 'name price image description');
    
    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }
    
    // Check if user is authorized to view this order
    if (req.user.role === 'customer' && order.user.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to view this order', 401));
    }
    
    if (req.user.role === 'shop_owner' && order.shop.toString() !== req.user.shop.toString()) {
        return next(new ErrorResponse('Not authorized to view this order', 401));
    }
    
    res.json({
        success: true,
        data: order
    });
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customers)
exports.createOrder = async (req, res, next) => {
    const { items, deliveryAddress, deliveryInstructions, paymentMethod } = req.body;
    
    if (!items || items.length === 0) {
        return next(new ErrorResponse('Please add items to your order', 400));
    }
    
    // Validate items and calculate total
    let total = 0;
    const orderItems = [];
    
    for (const item of items) {
        const product = await Product.findById(item.product);
        
        if (!product) {
            return next(new ErrorResponse(`Product ${item.product} not found`, 404));
        }
        
        if (!product.isActive) {
            return next(new ErrorResponse(`Product ${product.name} is not available`, 400));
        }
        
        if (product.stock < item.quantity) {
            return next(new ErrorResponse(`Insufficient stock for ${product.name}`, 400));
        }
        
        // Update product stock
        product.stock -= item.quantity;
        await product.save();
        
        orderItems.push({
            product: item.product,
            quantity: item.quantity,
            price: product.price,
            total: product.price * item.quantity
        });
        
        total += product.price * item.quantity;
    }
    
    // Add delivery fee
    const deliveryFee = total > 500 ? 0 : 50;
    total += deliveryFee;
    
    // Create order
    const order = await Order.create({
        user: req.user.id,
        items: orderItems,
        total,
        deliveryFee,
        deliveryAddress: deliveryAddress || req.user.address,
        deliveryInstructions,
        paymentMethod,
        shop: orderItems[0].product.shop // Assuming all items are from same shop
    });
    
    // Populate order details
    const populatedOrder = await Order.findById(order._id)
        .populate('user', 'name email phone')
        .populate('shop', 'name location')
        .populate('items.product', 'name price image');
    
    // Create notification for shop owner
    await Notification.createOrderStatusNotification(
        populatedOrder.shop.owner,
        order._id,
        'pending',
        order.orderNumber
    );
    
    res.status(201).json({
        success: true,
        data: populatedOrder
    });
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Shop owners)
exports.updateOrderStatus = async (req, res, next) => {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }
    
    // Make sure shop owner owns this order
    if (order.shop.toString() !== req.user.shop.toString()) {
        return next(new ErrorResponse('Not authorized to update this order', 401));
    }
    
    order.status = status;
    order.statusHistory.push({
        status,
        updatedBy: req.user.id,
        updatedAt: Date.now()
    });
    
    await order.save();
    
    // Create notification for customer
    await Notification.createOrderStatusNotification(
        order.user,
        order._id,
        status,
        order.orderNumber
    );
    
    const populatedOrder = await Order.findById(order._id)
        .populate('user', 'name email phone')
        .populate('shop', 'name location')
        .populate('items.product', 'name price image');
    
    res.json({
        success: true,
        data: populatedOrder
    });
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customers)
exports.cancelOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }
    
    // Make sure user owns this order
    if (order.user.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to cancel this order', 401));
    }
    
    // Check if order can be cancelled
    if (['delivered', 'cancelled'].includes(order.status)) {
        return next(new ErrorResponse('Order cannot be cancelled', 400));
    }
    
    order.status = 'cancelled';
    order.statusHistory.push({
        status: 'cancelled',
        updatedBy: req.user.id,
        updatedAt: Date.now()
    });
    
    await order.save();
    
    // Restore product stock
    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
            product.stock += item.quantity;
            await product.save();
        }
    }
    
    const populatedOrder = await Order.findById(order._id)
        .populate('user', 'name email phone')
        .populate('shop', 'name location')
        .populate('items.product', 'name price image');
    
    res.json({
        success: true,
        data: populatedOrder
    });
};

// @desc    Get my orders (Customer)
// @route   GET /api/orders
// @access  Private (Customers)
exports.getMyOrders = async (req, res, next) => {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = { user: req.user.id };
    
    if (status) {
        query.status = status;
    }
    
    const orders = await Order.find(query)
        .populate('shop', 'name location')
        .populate('items.product', 'name price image')
        .sort('-createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    
    res.json({
        success: true,
        data: orders,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        }
    });
};

// @desc    Get shop orders (Shop owner)
// @route   GET /api/orders/shop/orders
// @access  Private (Shop owners)
exports.getShopOrders = async (req, res, next) => {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = { shop: req.user.shop };
    
    if (status) {
        query.status = status;
    }
    
    const orders = await Order.find(query)
        .populate('user', 'name email phone')
        .populate('items.product', 'name price image')
        .sort('-createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    
    res.json({
        success: true,
        data: orders,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        }
    });
};

// @desc    Get order stats (Shop owner)
// @route   GET /api/orders/shop/stats
// @access  Private (Shop owners)
exports.getOrderStats = async (req, res, next) => {
    const { period = '30' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const stats = await Order.aggregate([
        {
            $match: {
                shop: req.user.shop,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$total' }
            }
        }
    ]);
    
    const totalOrders = await Order.countDocuments({
        shop: req.user.shop,
        createdAt: { $gte: startDate }
    });
    
    const totalRevenue = await Order.aggregate([
        {
            $match: {
                shop: req.user.shop,
                status: { $in: ['delivered', 'completed'] },
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$total' }
            }
        }
    ]);
    
    res.json({
        success: true,
        data: {
            stats,
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            period
        }
    });
};

// @desc    Rate order
// @route   POST /api/orders/:id/rate
// @access  Private (Customers)
exports.rateOrder = async (req, res, next) => {
    const { rating, review } = req.body;
    
    if (rating < 1 || rating > 5) {
        return next(new ErrorResponse('Rating must be between 1 and 5', 400));
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }
    
    // Make sure user owns this order
    if (order.user.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to rate this order', 401));
    }
    
    // Check if order is delivered
    if (order.status !== 'delivered') {
        return next(new ErrorResponse('Order must be delivered before rating', 400));
    }
    
    // Check if already rated
    if (order.rating) {
        return next(new ErrorResponse('Order already rated', 400));
    }
    
    order.rating = rating;
    order.review = review;
    order.ratedAt = Date.now();
    
    await order.save();
    
    // Update shop rating
    const shop = await Shop.findById(order.shop);
    if (shop) {
        const shopOrders = await Order.find({
            shop: order.shop,
            rating: { $exists: true }
        });
        
        const totalRating = shopOrders.reduce((sum, order) => sum + order.rating, 0);
        shop.rating = totalRating / shopOrders.length;
        await shop.save();
    }
    
    const populatedOrder = await Order.findById(order._id)
        .populate('user', 'name email phone')
        .populate('shop', 'name location')
        .populate('items.product', 'name price image');
    
    res.json({
        success: true,
        data: populatedOrder
    });
};
