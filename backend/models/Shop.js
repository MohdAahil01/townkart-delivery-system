const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a shop name'],
        trim: true,
        maxlength: [100, 'Shop name cannot be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    category: {
        type: String,
        required: [true, 'Please select a shop category'],
        enum: [
            'grocery',
            'pharmacy',
            'bakery',
            'stationery',
            'electronics',
            'clothing',
            'hardware',
            'cosmetics',
            'fruits_vegetables',
            'dairy',
            'meat_fish',
            'general_store',
            'other'
        ]
    },
    address: {
        street: {
            type: String,
            required: [true, 'Please provide street address']
        },
        city: {
            type: String,
            required: [true, 'Please provide city']
        },
        state: {
            type: String,
            required: [true, 'Please provide state']
        },
        pincode: {
            type: String,
            required: [true, 'Please provide pincode'],
            match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode']
        },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    contact: {
        phone: {
            type: String,
            required: [true, 'Please provide contact number'],
            match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
        },
        email: {
            type: String,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email'
            ]
        }
    },
    businessHours: {
        monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
    },
    images: [{
        type: String,
        default: []
    }],
    logo: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
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
    deliveryOptions: {
        homeDelivery: {
            type: Boolean,
            default: true
        },
        pickup: {
            type: Boolean,
            default: true
        },
        deliveryRadius: {
            type: Number,
            default: 5, // in kilometers
            min: 1,
            max: 20
        },
        deliveryCharge: {
            type: Number,
            default: 0,
            min: 0
        },
        minimumOrderAmount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    paymentMethods: {
        cod: {
            type: Boolean,
            default: true
        },
        online: {
            type: Boolean,
            default: false
        }
    },
    tags: [{
        type: String,
        trim: true
    }],
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for location-based queries
shopSchema.index({ "address.coordinates": "2dsphere" });

// Index for search functionality
shopSchema.index({ 
    name: "text", 
    description: "text", 
    category: "text",
    tags: "text"
});

// Virtual for average rating
shopSchema.virtual('averageRating').get(function() {
    return this.totalRatings > 0 ? (this.rating / this.totalRatings).toFixed(1) : 0;
});

// Ensure virtual fields are serialized
shopSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Shop', shopSchema);
