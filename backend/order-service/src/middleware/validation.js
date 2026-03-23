const { body, validationResult } = require('express-validator');

const validateOrder = [
  body('userId').trim().notEmpty().withMessage('User ID is required'),
  body('productId').trim().notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('paymentMethod').isIn(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'CASH_ON_DELIVERY']).withMessage('Invalid payment method'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateOrder };
