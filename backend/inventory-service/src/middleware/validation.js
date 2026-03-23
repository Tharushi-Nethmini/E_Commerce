const { body, validationResult } = require('express-validator');

const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('quantity').isNumeric().withMessage('Quantity must be a number').isInt({ min: 0 }).withMessage('Quantity cannot be negative'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const validateStockCheck = [
  body('productId').trim().notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateProduct, validateStockCheck };
