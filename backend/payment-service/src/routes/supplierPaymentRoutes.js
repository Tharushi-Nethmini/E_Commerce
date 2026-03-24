const express = require('express');
const router = express.Router();
const supplierPaymentController = require('../controllers/supplierPaymentController');

// POST /api/supplier-payments
router.post('/', supplierPaymentController.createSupplierPayment);

// GET /api/supplier-payments
router.get('/', supplierPaymentController.getSupplierPayments);

module.exports = router;
