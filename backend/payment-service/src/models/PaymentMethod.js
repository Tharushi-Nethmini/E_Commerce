const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Payment method type is required'],
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL']
  },
  brand: {
    type: String,
    trim: true
  },
  last4: {
    type: String,
    required: [true, 'Last 4 digits are required'],
    match: [/^\d{4}$/, 'Last 4 must be exactly 4 digits']
  },
  expiryMonth: {
    type: Number,
    min: [1, 'Expiry month must be between 1 and 12'],
    max: [12, 'Expiry month must be between 1 and 12']
  },
  expiryYear: {
    type: Number,
    min: [2024, 'Expiry year is invalid']
  },
  token: {
    type: String,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
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

paymentMethodSchema.index({ userId: 1, createdAt: -1 });

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;
