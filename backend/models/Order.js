const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    total: {
        type: Number,
        required: true,
        min: [0, 'Total cannot be negative']
    },
    notes: {
        type: String,
        maxlength: [200, 'Notes cannot be more than 200 characters']
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    },
    deliveryCharge: {
        type: Number,
        default: 0,
        min: [0, 'Delivery charge cannot be negative']
    },
    tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    total: {
        type: Number,
        required: true,
        min: [0, 'Total cannot be negative']
    },
    status: {
        type: String,
        enum: [
            'pending',
            'confirmed',
            'preparing',
            'ready_for_pickup',
            'out_for_delivery',
            'delivered',
            'cancelled',
            'refunded'
        ],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'online'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    deliveryType: {
        type: String,
        enum: ['home_delivery', 'pickup'],
        required: true
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    deliveryInstructions: {
        type: String,
        maxlength: [300, 'Delivery instructions cannot be more than 300 characters']
    },
    estimatedDeliveryTime: {
        type: Date
    },
    actualDeliveryTime: {
        type: Date
    },
    orderNotes: {
        type: String,
        maxlength: [500, 'Order notes cannot be more than 500 characters']
    },
    cancellationReason: {
        type: String,
        maxlength: [200, 'Cancellation reason cannot be more than 200 characters']
    },
    refundReason: {
        type: String,
        maxlength: [200, 'Refund reason cannot be more than 200 characters']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        maxlength: [500, 'Review cannot be more than 500 characters']
    },
    isRated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for order tracking
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ shop: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // Get count of orders for today
        const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        
        const orderCount = await this.constructor.countDocuments({
            createdAt: { $gte: todayStart, $lt: todayEnd }
        });
        
        const sequence = (orderCount + 1).toString().padStart(4, '0');
        this.orderNumber = `ORD${year}${month}${day}${sequence}`;
    }
    next();
});

// Virtual for order summary
orderSchema.virtual('itemCount').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Instance method to update order status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
    this.status = newStatus;
    if (notes) {
        this.orderNotes = notes;
    }
    
    // Set delivery time when status changes to delivered
    if (newStatus === 'delivered') {
        this.actualDeliveryTime = new Date();
    }
    
    return this.save();
};

// Static method to get order statistics
orderSchema.statics.getStats = async function(shopId, startDate, endDate) {
    const matchStage = {
        shop: shopId,
        createdAt: { $gte: startDate, $lte: endDate }
    };
    
    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$total' }
            }
        }
    ]);
};

module.exports = mongoose.model('Order', orderSchema);
