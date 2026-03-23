const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validatePayment = [
  body('userId').optional().trim().notEmpty().withMessage('User ID cannot be empty'),
  body('orderId').trim().notEmpty().withMessage('Order ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number').isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('paymentMethod').isIn(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'CASH_ON_DELIVERY']).withMessage('Invalid payment method'),
  validate
];

const validateRefund = [
  body('reason').optional().trim().isLength({ min: 3, max: 300 }).withMessage('Refund reason must be between 3 and 300 characters'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Refund amount must be greater than 0'),
  validate
];

const validatePaymentMethod = [
  body('userId').trim().notEmpty().withMessage('User ID is required'),
  body('type').isIn(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL']).withMessage('Invalid payment method type'),
  body('last4').matches(/^\d{4}$/).withMessage('Last 4 digits must be exactly 4 numbers'),
  body('brand').optional().trim().isLength({ max: 50 }).withMessage('Brand must be under 50 characters'),
  body('expiryMonth').optional().isInt({ min: 1, max: 12 }).withMessage('Expiry month must be between 1 and 12'),
  body('expiryYear').optional().isInt({ min: 2024 }).withMessage('Expiry year is invalid'),
  body('token').optional().trim().isLength({ max: 255 }).withMessage('Token is too long'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
  validate
];

const validatePaymentMethodUpdate = [
  body('type').optional().isIn(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL']).withMessage('Invalid payment method type'),
  body('last4').optional().matches(/^\d{4}$/).withMessage('Last 4 digits must be exactly 4 numbers'),
  body('brand').optional().trim().isLength({ max: 50 }).withMessage('Brand must be under 50 characters'),
  body('expiryMonth').optional().isInt({ min: 1, max: 12 }).withMessage('Expiry month must be between 1 and 12'),
  body('expiryYear').optional().isInt({ min: 2024 }).withMessage('Expiry year is invalid'),
  body('token').optional().trim().isLength({ max: 255 }).withMessage('Token is too long'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
  validate
];

module.exports = {
  validatePayment,
  validateRefund,
  validatePaymentMethod,
  validatePaymentMethodUpdate
};
