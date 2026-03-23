const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Only required for supplier-created products
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'REJECTED'],
      default: 'PENDING'
    },
    rejectionReason: {
      type: String,
      default: null
    },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  imagePublicId: {
    type: String,
    default: null
  },
  available: {
    type: Boolean,
    default: true
  },
  lowStockNotified: {
    type: Boolean,
    default: false
  },
  lowStockThreshold: {
    type: Number,
    default: 10 // Default threshold for low stock
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual for available stock (total - reserved)
productSchema.virtual('availableQuantity').get(function() {
  return this.quantity - this.reservedQuantity;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
