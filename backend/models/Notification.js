const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'stock_alert',
            'order_status',
            'delivery_update',
            'price_drop',
            'new_product',
            'promotion',
            'system_alert'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    message: {
        type: String,
        required: true,
        maxlength: [500, 'Message cannot be more than 500 characters']
    },
    data: {
        // Flexible data object for different notification types
        orderId: mongoose.Schema.Types.ObjectId,
        productId: mongoose.Schema.Types.ObjectId,
        shopId: mongoose.Schema.Types.ObjectId,
        url: String,
        image: String,
        price: Number,
        oldPrice: Number,
        quantity: Number
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isSent: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date
    },
    readAt: {
        type: Date
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    deliveryMethod: {
        email: {
            type: Boolean,
            default: false
        },
        sms: {
            type: Boolean,
            default: false
        },
        push: {
            type: Boolean,
            default: true
        }
    },
    scheduledFor: {
        type: Date
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, isSent: 1 });
notificationSchema.index({ scheduledFor: 1, isSent: 1 });
notificationSchema.index({ expiresAt: 1 });

// Pre-save middleware to set default expiration
notificationSchema.pre('save', function(next) {
    if (!this.expiresAt) {
        // Default expiration: 30 days from creation
        this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    next();
});

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for time until expiration
notificationSchema.virtual('timeUntilExpiry').get(function() {
    if (!this.expiresAt) return null;
    return Math.floor((this.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

// Instance method to mark as sent
notificationSchema.methods.markAsSent = function() {
    this.isSent = true;
    this.sentAt = new Date();
    return this.save();
};

// Static method to create stock alert notification
notificationSchema.statics.createStockAlert = async function(userId, productId, shopId, productName) {
    return await this.create({
        user: userId,
        type: 'stock_alert',
        title: 'Product Back in Stock!',
        message: `${productName} is now available in stock. Order now before it runs out again!`,
        data: {
            productId: productId,
            shopId: shopId
        },
        priority: 'high',
        deliveryMethod: {
            email: true,
            sms: true,
            push: true
        }
    });
};

// Static method to create order status notification
notificationSchema.statics.createOrderStatusNotification = async function(userId, orderId, status, orderNumber) {
    const statusMessages = {
        'confirmed': 'Your order has been confirmed and is being prepared.',
        'preparing': 'Your order is being prepared and will be ready soon.',
        'ready_for_pickup': 'Your order is ready for pickup!',
        'out_for_delivery': 'Your order is out for delivery and will reach you soon.',
        'delivered': 'Your order has been delivered successfully!'
    };

    return await this.create({
        user: userId,
        type: 'order_status',
        title: `Order ${orderNumber} - ${status.replace('_', ' ').toUpperCase()}`,
        message: statusMessages[status] || `Your order status has been updated to ${status}.`,
        data: {
            orderId: orderId
        },
        priority: 'medium',
        deliveryMethod: {
            email: true,
            push: true
        }
    });
};

// Static method to create price drop notification
notificationSchema.statics.createPriceDropNotification = async function(userId, productId, productName, oldPrice, newPrice) {
    const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    
    return await this.create({
        user: userId,
        type: 'price_drop',
        title: 'Price Drop Alert!',
        message: `${productName} price has dropped by ${discount}%! New price: ₹${newPrice}`,
        data: {
            productId: productId,
            oldPrice: oldPrice,
            price: newPrice
        },
        priority: 'high',
        deliveryMethod: {
            email: true,
            push: true
        }
    });
};

// Static method to get unread notifications count
notificationSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({
        user: userId,
        isRead: false,
        expiresAt: { $gt: new Date() }
    });
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = async function(userId) {
    return await this.updateMany(
        { user: userId, isRead: false },
        { 
            isRead: true, 
            readAt: new Date() 
        }
    );
};

module.exports = mongoose.model('Notification', notificationSchema);
