const express = require('express');
const router = express.Router();
const supplierPaymentController = require('../controllers/supplierPaymentController');


/**
 * @swagger
 * components:
 *   schemas:
 *     SupplierPayment:
 *       type: object
 *       required:
 *         - restockRequestId
 *         - supplierId
 *         - amount
 *         - paymentMethod
 *       properties:
 *         id:
 *           type: string
 *         restockRequestId:
 *           type: string
 *         supplierId:
 *           type: string
 *         amount:
 *           type: number
 *         paymentMethod:
 *           type: string
 *           enum: [BANK_TRANSFER, CASH, CHEQUE]
 *         bankDetails:
 *           type: object
 *           properties:
 *             accountName:
 *               type: string
 *             accountNumber:
 *               type: string
 *             bankName:
 *               type: string
 *             branch:
 *               type: string
 *         status:
 *           type: string
 *           enum: [PENDING, PAID, FAILED]
 *         paidAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/supplier-payments:
 *   post:
 *     summary: Create a supplier payment
 *     tags: [SupplierPayments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupplierPayment'
 *     responses:
 *       201:
 *         description: Supplier payment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupplierPayment'
 *       400:
 *         description: Invalid input
 */
// POST /api/supplier-payments
router.post('/', supplierPaymentController.createSupplierPayment);


/**
 * @swagger
 * /api/supplier-payments:
 *   get:
 *     summary: Get all supplier payments
 *     tags: [SupplierPayments]
 *     responses:
 *       200:
 *         description: List of supplier payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupplierPayment'
 */
// GET /api/supplier-payments
router.get('/', supplierPaymentController.getSupplierPayments);

module.exports = router;
