const Shop = require('../models/Shop');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all shops
// @route   GET /api/shops
// @access  Public
const getShops = asyncHandler(async (req, res, next) => {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Shop.find(JSON.parse(queryStr)).populate('owner', 'name email phone');

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Shop.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const shops = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }

    res.status(200).json({
        success: true,
        count: shops.length,
        pagination,
        data: shops
    });
});

// @desc    Get single shop
// @route   GET /api/shops/:id
// @access  Public
const getShop = asyncHandler(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id)
        .populate('owner', 'name email phone')
        .populate({
            path: 'products',
            select: 'name price stock isAvailable images mainImage'
        });

    if (!shop) {
        return next(new ErrorResponse(`Shop not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: shop
    });
});

// @desc    Create new shop
// @route   POST /api/shops
// @access  Private
const createShop = asyncHandler(async (req, res, next) => {
    // Add owner to req.body
    req.body.owner = req.user.id;

    const shop = await Shop.create(req.body);

    res.status(201).json({
        success: true,
        data: shop
    });
});

// @desc    Update shop
// @route   PUT /api/shops/:id
// @access  Private
const updateShop = asyncHandler(async (req, res, next) => {
    let shop = await Shop.findById(req.params.id);

    if (!shop) {
        return next(new ErrorResponse(`Shop not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is shop owner or admin
    if (shop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this shop`, 401));
    }

    shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: shop
    });
});

// @desc    Delete shop
// @route   DELETE /api/shops/:id
// @access  Private
const deleteShop = asyncHandler(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
        return next(new ErrorResponse(`Shop not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is shop owner or admin
    if (shop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this shop`, 401));
    }

    await shop.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get shops owned by current user
// @route   GET /api/shops/my-shops
// @access  Private
const getMyShops = asyncHandler(async (req, res, next) => {
    const shops = await Shop.find({ owner: req.user.id });

    res.status(200).json({
        success: true,
        count: shops.length,
        data: shops
    });
});

// @desc    Upload shop image
// @route   PUT /api/shops/:id/image
// @access  Private
const uploadShopImage = asyncHandler(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
        return next(new ErrorResponse(`Shop not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is shop owner or admin
    if (shop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this shop`, 401));
    }

    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    // TODO: Upload to cloudinary and get URL
    // const result = await cloudinary.uploader.upload(req.file.path);
    // shop.logo = result.secure_url;

    await shop.save();

    res.status(200).json({
        success: true,
        data: shop
    });
});

// @desc    Search shops
// @route   GET /api/shops/search
// @access  Public
const searchShops = asyncHandler(async (req, res, next) => {
    const { q, category, city, minRating, maxRating } = req.query;

    let query = { isActive: true };

    // Text search
    if (q) {
        query.$text = { $search: q };
    }

    // Category filter
    if (category) {
        query.category = category;
    }

    // City filter
    if (city) {
        query['address.city'] = { $regex: city, $options: 'i' };
    }

    // Rating filter
    if (minRating || maxRating) {
        query.rating = {};
        if (minRating) query.rating.$gte = parseFloat(minRating);
        if (maxRating) query.rating.$lte = parseFloat(maxRating);
    }

    const shops = await Shop.find(query)
        .populate('owner', 'name email phone')
        .sort({ rating: -1, createdAt: -1 });

    res.status(200).json({
        success: true,
        count: shops.length,
        data: shops
    });
});

// @desc    Get shops by category
// @route   GET /api/shops/category/:category
// @access  Public
const getShopsByCategory = asyncHandler(async (req, res, next) => {
    const shops = await Shop.find({
        category: req.params.category,
        isActive: true
    })
    .populate('owner', 'name email phone')
    .sort({ rating: -1, createdAt: -1 });

    res.status(200).json({
        success: true,
        count: shops.length,
        data: shops
    });
});

// @desc    Get nearby shops
// @route   GET /api/shops/nearby
// @access  Public
const getNearbyShops = asyncHandler(async (req, res, next) => {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
        return next(new ErrorResponse('Please provide latitude and longitude', 400));
    }

    const shops = await Shop.find({
        isActive: true,
        'address.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
            }
        }
    })
    .populate('owner', 'name email phone')
    .limit(20);

    res.status(200).json({
        success: true,
        count: shops.length,
        data: shops
    });
});

// @desc    Toggle shop status
// @route   PUT /api/shops/:id/status
// @access  Private
const toggleShopStatus = asyncHandler(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
        return next(new ErrorResponse(`Shop not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is shop owner or admin
    if (shop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this shop`, 401));
    }

    shop.isActive = !shop.isActive;
    await shop.save();

    res.status(200).json({
        success: true,
        data: shop
    });
});

// @desc    Update shop rating
// @route   POST /api/shops/:id/rating
// @access  Private
const updateShopRating = asyncHandler(async (req, res, next) => {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return next(new ErrorResponse('Please provide a valid rating between 1 and 5', 400));
    }

    const shop = await Shop.findById(req.params.id);

    if (!shop) {
        return next(new ErrorResponse(`Shop not found with id of ${req.params.id}`, 404));
    }

    // Update rating
    const newTotalRatings = shop.totalRatings + 1;
    const newRating = ((shop.rating * shop.totalRatings) + rating) / newTotalRatings;

    shop.rating = newRating;
    shop.totalRatings = newTotalRatings;

    await shop.save();

    res.status(200).json({
        success: true,
        data: shop
    });
});

module.exports = {
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
};
