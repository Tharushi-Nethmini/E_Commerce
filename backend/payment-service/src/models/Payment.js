const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: String,
    index: true
  },
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'CASH_ON_DELIVERY']
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  failureReason: {
    type: String
  },
  processedAt: {
    type: Date
  },
  refund: {
    status: {
      type: String,
      enum: ['NONE', 'REQUESTED', 'REFUNDED'],
      default: 'NONE'
    },
    reason: {
      type: String
    },
    amount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative']
    },
    requestedAt: {
      type: Date
    },
    refundedAt: {
      type: Date
    }
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

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
