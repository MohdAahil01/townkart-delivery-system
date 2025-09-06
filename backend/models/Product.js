const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a product name'],
        trim: true,
        maxlength: [100, 'Product name cannot be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    category: {
        type: String,
        required: [true, 'Please select a product category'],
        enum: [
            'grocery',
            'beverages',
            'snacks',
            'dairy',
            'fruits_vegetables',
            'meat_fish',
            'bakery',
            'pharmacy',
            'personal_care',
            'household',
            'electronics',
            'clothing',
            'stationery',
            'hardware',
            'cosmetics',
            'other'
        ]
    },
    subcategory: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Original price cannot be negative']
    },
    unit: {
        type: String,
        required: [true, 'Please provide a unit'],
        enum: [
            'kg', 'g', 'l', 'ml', 'pcs', 'pack', 'dozen', 'bottle', 'can', 'box', 'bag', 'piece'
        ]
    },
    weight: {
        type: Number,
        min: [0, 'Weight cannot be negative']
    },
    stock: {
        type: Number,
        required: [true, 'Please provide stock quantity'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    minStock: {
        type: Number,
        default: 5,
        min: [0, 'Minimum stock cannot be negative']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    images: [{
        type: String,
        default: []
    }],
    mainImage: {
        type: String,
        default: null
    },
    tags: [{
        type: String,
        trim: true
    }],
    nutritionalInfo: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        sugar: Number
    },
    expiryDate: {
        type: Date
    },
    isVegetarian: {
        type: Boolean,
        default: null // null means not specified
    },
    isGlutenFree: {
        type: Boolean,
        default: false
    },
    isOrganic: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    totalSold: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    barcode: {
        type: String,
        unique: true,
        sparse: true
    },
    sku: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});

// Index for search functionality
productSchema.index({ 
    name: "text", 
    description: "text", 
    category: "text",
    brand: "text",
    tags: "text"
});

// Index for shop-based queries
productSchema.index({ shop: 1, category: 1 });

// Index for availability and price
productSchema.index({ isAvailable: 1, price: 1 });

// Virtual for average rating
productSchema.virtual('averageRating').get(function() {
    return this.totalRatings > 0 ? (this.rating / this.totalRatings).toFixed(1) : 0;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (this.stock === 0) return 'out_of_stock';
    if (this.stock <= this.minStock) return 'low_stock';
    return 'in_stock';
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update availability based on stock
productSchema.pre('save', function(next) {
    this.isAvailable = this.stock > 0;
    next();
});

module.exports = mongoose.model('Product', productSchema);
