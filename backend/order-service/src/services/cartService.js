const Cart = require('../models/Cart');
const serviceClient = require('../clients/serviceClient');

class CartService {
  // Get cart for a user (create if not exists)
  async getCart(userId) {
    try {
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = new Cart({ userId, items: [] });
        await cart.save();
      }
      return cart;
    } catch (error) {
      throw error;
    }
  }

  // Add item to cart (or increase quantity if already exists)
  async addToCart(userId, productId, quantity) {
    try {
      // Verify stock availability via inventory service
      const stockCheck = await serviceClient.checkStock(productId, quantity);
      if (!stockCheck.available) {
        throw new Error(stockCheck.message || 'Product not available');
      }

      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = new Cart({ userId, items: [] });
      }

      const existingItem = cart.items.find(item => item.productId === productId);
      if (existingItem) {
        // Check combined quantity
        const newQty = existingItem.quantity + quantity;
        const combined = await serviceClient.checkStock(productId, newQty);
        if (!combined.available) {
          throw new Error(combined.message || 'Insufficient stock for requested quantity');
        }
        existingItem.quantity = newQty;
      } else {
        cart.items.push({
          productId,
          productName: stockCheck.productName,
          price: stockCheck.price,
          quantity,
          imageUrl: null
        });
      }

      cart.updatedAt = new Date();
      await cart.save();
      return cart;
    } catch (error) {
      throw error;
    }
  }

  // Update item quantity
  async updateCartItem(userId, productId, quantity) {
    try {
      if (quantity < 1) {
        return this.removeCartItem(userId, productId);
      }

      const stockCheck = await serviceClient.checkStock(productId, quantity);
      if (!stockCheck.available) {
        throw new Error(stockCheck.message || 'Insufficient stock');
      }

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        throw new Error('Cart not found');
      }

      const item = cart.items.find(i => i.productId === productId);
      if (!item) {
        throw new Error('Item not found in cart');
      }

      item.quantity = quantity;
      item.price = stockCheck.price;
      cart.updatedAt = new Date();
      await cart.save();
      return cart;
    } catch (error) {
      throw error;
    }
  }

  // Remove specific item from cart
  async removeCartItem(userId, productId) {
    try {
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        throw new Error('Cart not found');
      }

      cart.items = cart.items.filter(item => item.productId !== productId);
      cart.updatedAt = new Date();
      await cart.save();
      return cart;
    } catch (error) {
      throw error;
    }
  }

  // Clear entire cart
  async clearCart(userId) {
    try {
      const cart = await Cart.findOne({ userId });
      if (cart) {
        cart.items = [];
        cart.updatedAt = new Date();
        await cart.save();
      }
      return { message: 'Cart cleared' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CartService();
