const mongoose = require('mongoose');

const supplierPaymentSchema = new mongoose.Schema({
  restockRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestockRequest',
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['BANK_TRANSFER', 'CASH', 'CHEQUE'],
    required: true
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    branch: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  },
  paidAt: Date
}, { timestamps: true });

module.exports = mongoose.model('SupplierPayment', supplierPaymentSchema);
