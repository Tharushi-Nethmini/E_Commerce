const Order = require('../models/Order');
const serviceClient = require('../clients/serviceClient');

class OrderService {
  // Create order (orchestrates all services)
  async createOrder(orderData) {
    const { userId, productId, quantity, paymentMethod } = orderData;

    try {
      // Step 1: Check stock availability
      console.log('📦 Step 1: Checking stock availability...');
      const stockCheck = await serviceClient.checkStock(productId, quantity);
      
      if (!stockCheck.available) {
        throw new Error(stockCheck.message || 'Stock not available');
      }

      const totalAmount = stockCheck.price * quantity;

      // Step 2: Reserve stock
      console.log('🔒 Step 2: Reserving stock...');
      const stockReservation = await serviceClient.reserveStock(productId, quantity);
      
      if (!stockReservation.success) {
        throw new Error('Failed to reserve stock');
      }

      // Step 3: Create order record
      console.log('📝 Step 3: Creating order record...');
      const order = new Order({
        userId,
        productId,
        quantity,
        totalAmount,
        paymentMethod,
        status: 'PENDING'
      });

      await order.save();

      try {
        // Step 4: Process payment
        console.log('💳 Step 4: Processing payment...');
        const paymentResult = await serviceClient.processPayment(
          order._id.toString(),
          userId,
          totalAmount,
          paymentMethod
        );

        if (!paymentResult.success) {
          // Payment failed - rollback
          order.status = 'FAILED';
          order.failureReason = paymentResult.message || 'Payment failed';
          await order.save();

          // Release reserved stock
          await serviceClient.releaseStock(productId, quantity);

          throw new Error(paymentResult.message || 'Payment failed');
        }

        // Step 5: Confirm stock (deduct from inventory)
        console.log('✅ Step 5: Confirming stock...');
        order.paymentId = paymentResult.paymentId;
        await serviceClient.confirmStock(productId, quantity);

        // Step 6: Keep status as PENDING - admin must review and confirm
        order.status = 'PENDING';
        await order.save();

        console.log('🎉 Order created successfully - awaiting admin confirmation!');

        return {
          success: true,
          order: order.toJSON(),
          message: 'Order created successfully'
        };

      } catch (error) {
        // If any step fails after order creation, mark as failed
        order.status = 'FAILED';
        order.failureReason = error.message;
        await order.save();

        throw error;
      }

    } catch (error) {
      console.error('❌ Order creation failed:', error.message);
      throw error;
    }
  }

  // Get order by ID
  async getOrderById(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      return order;
    } catch (error) {
      throw error;
    }
  }

  // Get all orders
  async getAllOrders() {
    try {
      return await Order.find().sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Get orders by user
  async getOrdersByUser(userId) {
    try {
      return await Order.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(orderId) {
    try {
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new Error('Order cannot be cancelled in current status');
      }

      // Release stock if order was confirmed
      if (order.status === 'CONFIRMED') {
        await serviceClient.releaseStock(order.productId, order.quantity);
      }

      // Auto-refund the payment if it exists and is COMPLETED
      const refundResult = await serviceClient.refundPayment(order._id.toString());
      if (refundResult.success) {
        console.log(`💰 Payment refunded for order ${order._id}`);
      }

      order.status = 'CANCELLED';
      order.updatedAt = new Date();
      await order.save();

      return {
        success: true,
        message: 'Order cancelled and payment refunded successfully',
        order: order.toJSON()
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete order (admin only)
  async deleteOrder(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      await Order.findByIdAndDelete(orderId);
    } catch (error) {
      throw error;
    }
  }

  // Order statistics for analytics dashboard
  async getOrderStats() {
    try {
      const totalOrders = await Order.countDocuments();

      const revenueResult = await Order.aggregate([
        { $match: { status: { $in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const totalRevenue = revenueResult[0]?.total || 0;

      const byStatusResult = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const byStatus = byStatusResult.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {});

      const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const ordersToday = await Order.countDocuments({ createdAt: { $gte: today } });

      return { totalOrders, totalRevenue, byStatus, recentOrders, ordersToday };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OrderService();
