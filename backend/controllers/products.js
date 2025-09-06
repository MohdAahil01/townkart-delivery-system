const Product = require('../models/Product');
const Shop = require('../models/Shop');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
    const { page = 1, limit = 20, category, minPrice, maxPrice, sort = '-createdAt' } = req.query;
    
    const query = { isActive: true };
    
    if (category) {
        query.category = category;
    }
    
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    const products = await Product.find(query)
        .populate('shop', 'name location')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await Product.countDocuments(query);
    
    res.json({
        success: true,
        data: products,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        }
    });
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id)
        .populate('shop', 'name location phone email');
    
    if (!product) {
        return next(new ErrorResponse('Product not found', 404));
    }
    
    res.json({
        success: true,
        data: product
    });
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Shop owners)
exports.createProduct = async (req, res, next) => {
    req.body.shop = req.user.shop;
    
    const product = await Product.create(req.body);
    
    res.status(201).json({
        success: true,
        data: product
    });
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Shop owners)
exports.updateProduct = async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
        return next(new ErrorResponse('Product not found', 404));
    }
    
    // Make sure user owns the product
    if (product.shop.toString() !== req.user.shop.toString()) {
        return next(new ErrorResponse('Not authorized to update this product', 401));
    }
    
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    
    res.json({
        success: true,
        data: product
    });
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Shop owners)
exports.deleteProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        return next(new ErrorResponse('Product not found', 404));
    }
    
    // Make sure user owns the product
    if (product.shop.toString() !== req.user.shop.toString()) {
        return next(new ErrorResponse('Not authorized to delete this product', 401));
    }
    
    await product.remove();
    
    res.json({
        success: true,
        data: {}
    });
};

// @desc    Get products by shop
// @route   GET /api/products/shop/:shopId
// @access  Public
exports.getShopProducts = async (req, res, next) => {
    const { page = 1, limit = 20, category } = req.query;
    
    const query = { shop: req.params.shopId, isActive: true };
    
    if (category) {
        query.category = category;
    }
    
    const products = await Product.find(query)
        .populate('shop', 'name location')
        .sort('-createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await Product.countDocuments(query);
    
    res.json({
        success: true,
        data: products,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        }
    });
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = async (req, res, next) => {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
        return next(new ErrorResponse('Please provide a search query', 400));
    }
    
    const query = {
        $and: [
            { isActive: true },
            {
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                    { category: { $regex: q, $options: 'i' } }
                ]
            }
        ]
    };
    
    const products = await Product.find(query)
        .populate('shop', 'name location')
        .sort('-createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await Product.countDocuments(query);
    
    res.json({
        success: true,
        data: products,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        }
    });
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;
    
    const products = await Product.find({
        category: req.params.category,
        isActive: true
    })
        .populate('shop', 'name location')
        .sort('-createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await Product.countDocuments({
        category: req.params.category,
        isActive: true
    });
    
    res.json({
        success: true,
        data: products,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        }
    });
};

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private (Shop owners)
exports.updateStock = async (req, res, next) => {
    const { stock } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        return next(new ErrorResponse('Product not found', 404));
    }
    
    // Make sure user owns the product
    if (product.shop.toString() !== req.user.shop.toString()) {
        return next(new ErrorResponse('Not authorized to update this product', 401));
    }
    
    product.stock = stock;
    await product.save();
    
    res.json({
        success: true,
        data: product
    });
};

// @desc    Toggle product status
// @route   PUT /api/products/:id/status
// @access  Private (Shop owners)
exports.toggleProductStatus = async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        return next(new ErrorResponse('Product not found', 404));
    }
    
    // Make sure user owns the product
    if (product.shop.toString() !== req.user.shop.toString()) {
        return next(new ErrorResponse('Not authorized to update this product', 401));
    }
    
    product.isActive = !product.isActive;
    await product.save();
    
    res.json({
        success: true,
        data: product
    });
};

// @desc    Update product rating
// @route   POST /api/products/:id/rating
// @access  Private (Customers)
exports.updateProductRating = async (req, res, next) => {
    const { rating, review } = req.body;
    
    if (rating < 1 || rating > 5) {
        return next(new ErrorResponse('Rating must be between 1 and 5', 400));
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        return next(new ErrorResponse('Product not found', 404));
    }
    
    // Check if user has already rated this product
    const existingRating = product.ratings.find(
        r => r.user.toString() === req.user.id
    );
    
    if (existingRating) {
        // Update existing rating
        existingRating.rating = rating;
        existingRating.review = review;
        existingRating.updatedAt = Date.now();
    } else {
        // Add new rating
        product.ratings.push({
            user: req.user.id,
            rating,
            review
        });
    }
    
    // Calculate average rating
    const totalRating = product.ratings.reduce((sum, item) => sum + item.rating, 0);
    product.rating = totalRating / product.ratings.length;
    
    await product.save();
    
    res.json({
        success: true,
        data: product
    });
};

// @desc    Upload product image
// @route   PUT /api/products/:id/image
// @access  Private (Shop owners)
exports.uploadProductImage = async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        return next(new ErrorResponse('Product not found', 404));
    }
    
    // Make sure user owns the product
    if (product.shop.toString() !== req.user.shop.toString()) {
        return next(new ErrorResponse('Not authorized to update this product', 401));
    }
    
    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }
    
    // Update product image
    product.image = req.file.path;
    await product.save();
    
    res.json({
        success: true,
        data: product
    });
};
