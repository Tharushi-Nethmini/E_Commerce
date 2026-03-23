const cartService = require('../services/cartService');

class CartController {
  // GET /api/cart?userId=...
  async getCart(req, res) {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }
      const cart = await cartService.getCart(userId);
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // POST /api/cart/add  { userId, productId, quantity }
  async addToCart(req, res) {
    try {
      const { userId, productId, quantity = 1 } = req.body;
      if (!userId || !productId) {
        return res.status(400).json({ message: 'userId and productId are required' });
      }
      const cart = await cartService.addToCart(userId, productId, parseInt(quantity));
      res.status(200).json(cart);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // PUT /api/cart/:productId  { userId, quantity }
  async updateCartItem(req, res) {
    try {
      const { productId } = req.params;
      const { userId, quantity } = req.body;
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }
      const cart = await cartService.updateCartItem(userId, productId, parseInt(quantity));
      res.status(200).json(cart);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // DELETE /api/cart/:productId  { userId }  (or ?userId=... )
  async removeCartItem(req, res) {
    try {
      const { productId } = req.params;
      const userId = req.body.userId || req.query.userId;
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }
      const cart = await cartService.removeCartItem(userId, productId);
      res.status(200).json(cart);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // DELETE /api/cart  { userId }  (or ?userId=...)
  async clearCart(req, res) {
    try {
      const userId = req.body.userId || req.query.userId;
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }
      const result = await cartService.clearCart(userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new CartController();
