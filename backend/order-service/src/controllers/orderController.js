const orderService = require('../services/orderService');

class OrderController {
  // Create order
  async createOrder(req, res) {
    try {
      const result = await orderService.createOrder(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
  }

  // Get order by ID
  async getOrderById(req, res) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      res.status(200).json(order);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Get all orders
  async getAllOrders(req, res) {
    try {
      const { userId } = req.query;
      const orders = userId
        ? await orderService.getOrdersByUser(userId)
        : await orderService.getAllOrders();
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id, status);
      res.status(200).json(order);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Cancel order
  async cancelOrder(req, res) {
    try {
      const result = await orderService.cancelOrder(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Delete order (admin only)
  async deleteOrder(req, res) {
    try {
      await orderService.deleteOrder(req.params.id);
      res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Order statistics
  async getOrderStats(req, res) {
    try {
      const stats = await orderService.getOrderStats();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new OrderController();
