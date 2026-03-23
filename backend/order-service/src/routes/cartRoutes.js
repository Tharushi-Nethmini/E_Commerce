const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user cart
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart details with items
 */
router.get('/', cartController.getCart);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *             properties:
 *               userId:
 *                 type: string
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 default: 1
 *     responses:
 *       200:
 *         description: Updated cart
 *       400:
 *         description: Stock unavailable
 */
router.post('/add', cartController.addToCart);

/**
 * @swagger
 * /api/cart/{productId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               userId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.put('/:productId', cartController.updateCartItem);

/**
 * @swagger
 * /api/cart/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated cart
 */
router.delete('/:productId', cartController.removeCartItem);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/', cartController.clearCart);

module.exports = router;
