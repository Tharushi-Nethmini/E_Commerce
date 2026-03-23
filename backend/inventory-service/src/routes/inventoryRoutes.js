
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { validateProduct, validateStockCheck } = require('../middleware/validation');
const { upload } = require('../config/cloudinary');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Delete a restock request (admin)
router.delete('/restock-requests/:id', /* authenticateToken, authorizeRoles('ADMIN'), */ inventoryController.deleteRestockRequest);

// Mark a fulfilled restock request as paid (admin)
router.patch('/restock-requests/:id/pay', /* authenticateToken, authorizeRoles('ADMIN'), */ inventoryController.payRestockRequest);
// Get only fulfilled restock requests (for admin payments)
router.get('/restock-requests/fulfilled', /* authenticateToken, authorizeRoles('ADMIN'), */ inventoryController.getFulfilledRestockRequests);

// Get only paid restock requests (for admin payments)
router.get('/restock-requests/paid', /* authenticateToken, authorizeRoles('ADMIN'), */ inventoryController.getPaidRestockRequests);

// Supplier fulfill restock request
router.patch('/restock-requests/:id/fulfill', /* authenticateToken, authorizeRoles('SUPPLIER'), */ inventoryController.fulfillRestockRequest);


// Admin restock request endpoint
router.post('/restock-request', /* authenticateToken, authorizeRoles('ADMIN'), */ inventoryController.createRestockRequest);

// Get restock requests (admin: all, supplier: only their products)
router.get('/restock-requests', /* authenticateToken, authorizeRoles('ADMIN', 'SUPPLIER'), */ inventoryController.getRestockRequests);

/**
 * @swagger
 * /api/inventory/products/{id}/approve:
 *   put:
 *     summary: Approve a pending product (admin only)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product approved
 *       404:
 *         description: Product not found
 */
router.put('/products/:id/approve', authenticateToken, authorizeRoles('ADMIN'), inventoryController.approveProduct);

/**
 * @swagger
 * /api/inventory/products/{id}/reject:
 *   put:
 *     summary: Reject a pending product (admin only)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product rejected
 *       404:
 *         description: Product not found
 */
router.put('/products/:id/reject', authenticateToken, authorizeRoles('ADMIN'), inventoryController.rejectProduct);

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - quantity
 *         - category
 *         - sku
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         quantity:
 *           type: number
 *         category:
 *           type: string
 *         sku:
 *           type: string
 *         imageUrl:
 *           type: string
 *         imagePublicId:
 *           type: string
 *         available:
 *           type: boolean
 *         reservedQuantity:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/inventory/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/products', authenticateToken, authorizeRoles('ADMIN', 'SUPPLIER'), validateProduct, inventoryController.createProduct);

/**
 * @swagger
 * /api/inventory/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all products
 */
router.get('/products', authenticateToken, inventoryController.getAllProducts);

/**
 * @swagger
 * /api/inventory/products/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *         description: Stock threshold (default 10)
 *     responses:
 *       200:
 *         description: List of low stock products
 */
router.get('/products/low-stock', inventoryController.getLowStockProducts);

/**
 * @swagger
 * /api/inventory/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/products/:id', inventoryController.getProductById);

/**
 * @swagger
 * /api/inventory/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/products/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPPLIER'), validateProduct, inventoryController.updateProduct);

/**
 * @swagger
 * /api/inventory/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/products/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPPLIER'), inventoryController.deleteProduct);

/**
 * @swagger
 * /api/inventory/check-stock:
 *   post:
 *     summary: Check stock availability
 *     tags: [Stock Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Stock availability status
 */
router.post('/check-stock', validateStockCheck, inventoryController.checkStock);

/**
 * @swagger
 * /api/inventory/reserve-stock:
 *   post:
 *     summary: Reserve stock for order
 *     tags: [Stock Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Stock reserved successfully
 */
router.post('/reserve-stock', validateStockCheck, inventoryController.reserveStock);

/**
 * @swagger
 * /api/inventory/confirm-stock:
 *   post:
 *     summary: Confirm stock reservation
 *     tags: [Stock Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Stock confirmed successfully
 */
router.post('/confirm-stock', validateStockCheck, inventoryController.confirmStock);

/**
 * @swagger
 * /api/inventory/release-stock:
 *   post:
 *     summary: Release reserved stock
 *     tags: [Stock Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Stock released successfully
 */
router.post('/release-stock', validateStockCheck, inventoryController.releaseStock);

/**
 * @swagger
 * /api/inventory/products/{id}/image:
 *   post:
 *     summary: Upload product image
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid file or request
 */
router.post('/products/:id/image', authenticateToken, authorizeRoles('ADMIN', 'SUPPLIER'), upload.single('image'), inventoryController.uploadProductImage);

/**
 * @swagger
 * /api/inventory/products/{id}/image:
 *   delete:
 *     summary: Delete product image
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Product or image not found
 */
router.delete('/products/:id/image', authenticateToken, authorizeRoles('ADMIN'), inventoryController.deleteProductImage);

module.exports = router;
