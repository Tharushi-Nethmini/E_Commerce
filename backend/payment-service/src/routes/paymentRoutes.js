const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const {
	validatePayment,
	validateRefund,
	validatePaymentMethod,
	validatePaymentMethodUpdate
} = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - orderId
 *         - amount
 *         - paymentMethod
 *       properties:
 *         id:
 *           type: string
 *         orderId:
 *           type: string
 *         amount:
 *           type: number
 *         paymentMethod:
 *           type: string
 *           enum: [CREDIT_CARD, DEBIT_CARD, PAYPAL, CASH_ON_DELIVERY]
 *         transactionId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED]
 *     PaymentMethod:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *         - last4
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [CREDIT_CARD, DEBIT_CARD, PAYPAL]
 *         brand:
 *           type: string
 *         last4:
 *           type: string
 *         expiryMonth:
 *           type: integer
 *         expiryYear:
 *           type: integer
 *         isDefault:
 *           type: boolean
 */

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process a payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid payment data
 */
router.post('/process', validatePayment, paymentController.processPayment);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: List of all payments
 */
router.get('/', paymentController.getAllPayments);

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get payment history with filters and pagination
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Filtered payment history
 */
router.get('/history', paymentController.getPaymentHistory);

/**
 * @swagger
 * /api/payments/methods:
 *   post:
 *     summary: Create a payment method
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentMethod'
 *     responses:
 *       201:
 *         description: Payment method created
 *       400:
 *         description: Validation failed
 */
router.post('/methods', validatePaymentMethod, paymentController.createPaymentMethod);

/**
 * @swagger
 * /api/payments/methods/{userId}:
 *   get:
 *     summary: Get all payment methods for a user
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of payment methods
 */
router.get('/methods/:userId', paymentController.getPaymentMethodsByUserId);

/**
 * @swagger
 * /api/payments/methods/{methodId}:
 *   put:
 *     summary: Update a payment method
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: methodId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentMethod'
 *     responses:
 *       200:
 *         description: Updated payment method
 *       400:
 *         description: Validation failed
 *   delete:
 *     summary: Delete a payment method
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: methodId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment method deleted
 *       404:
 *         description: Payment method not found
 */
router.put('/methods/:methodId', validatePaymentMethodUpdate, paymentController.updatePaymentMethod);

router.delete('/methods/:methodId', paymentController.deletePaymentMethod);

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: Get payment by order ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details for order
 *       404:
 *         description: Payment not found
 */
router.get('/order/:orderId', paymentController.getPaymentByOrderId);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 */
router.get('/:id', paymentController.getPaymentById);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Refund a payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *       404:
 *         description: Payment not found
 */
router.post('/:id/refund', validateRefund, paymentController.refundPayment);

/**
 * @swagger
 * /api/payments/{id}/refund-status:
 *   get:
 *     summary: Get refund status of a payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Refund status details
 *       404:
 *         description: Payment not found
 */
router.get('/:id/refund-status', paymentController.getRefundStatus);

/**
 * @swagger
 * /api/payments/{id}/invoice:
 *   get:
 *     summary: Generate invoice data for a payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice payload
 *       400:
 *         description: Invoice cannot be generated
 */
router.get('/:id/invoice', paymentController.generateInvoice);

/**
 * @swagger
 * /api/payments/status:
 *   post:
 *     summary: Get payment status
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment status
 */
router.post('/status', paymentController.getPaymentStatus);

/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Delete a payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment deleted
 *       404:
 *         description: Payment not found
 */
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
