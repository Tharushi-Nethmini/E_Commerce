const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8081';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8082';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:8083';

class ServiceClient {
  // User Service calls
  async validateUser(token) {
    try {
      const response = await axios.post(`${USER_SERVICE_URL}/api/users/validate`, { token });
      return response.data;
    } catch (error) {
      console.error('Error validating user:', error.message);
      throw new Error('User validation failed');
    }
  }

  async getUserFromToken(token) {
    try {
      const response = await axios.post(`${USER_SERVICE_URL}/api/users/validate/user`, { token });
      return response.data;
    } catch (error) {
      console.error('Error getting user from token:', error.message);
      throw new Error('Failed to get user details');
    }
  }

  // Inventory Service calls
  async checkStock(productId, quantity) {
    try {
      const response = await axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/check-stock`, {
        productId,
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error checking stock:', error.message);
      throw new Error('Stock check failed');
    }
  }

  async reserveStock(productId, quantity) {
    try {
      const response = await axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/reserve-stock`, {
        productId,
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error reserving stock:', error.message);
      throw new Error('Stock reservation failed');
    }
  }

  async confirmStock(productId, quantity) {
    try {
      const response = await axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/confirm-stock`, {
        productId,
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error confirming stock:', error.message);
      throw new Error('Stock confirmation failed');
    }
  }

  async releaseStock(productId, quantity) {
    try {
      const response = await axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/release-stock`, {
        productId,
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error releasing stock:', error.message);
      // Don't throw error here as this is cleanup
      return { success: false };
    }
  }

  // Payment Service calls
  async processPayment(orderId, userId, amount, paymentMethod) {
    try {
      const response = await axios.post(`${PAYMENT_SERVICE_URL}/api/payments/process`, {
        orderId,
        userId,
        amount,
        paymentMethod
      });
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error.message);
      throw new Error('Payment processing failed');
    }
  }

  async getPaymentStatus(orderId) {
    try {
      const response = await axios.post(`${PAYMENT_SERVICE_URL}/api/payments/status`, {
        orderId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting payment status:', error.message);
      return { exists: false };
    }
  }

  async refundPayment(orderId) {
    try {
      // First find the payment by orderId
      const paymentResponse = await axios.get(`${PAYMENT_SERVICE_URL}/api/payments/order/${orderId}`);
      const payment = paymentResponse.data;
      if (!payment || !payment._id) return { success: false };
      // Then refund it
      const refundResponse = await axios.post(`${PAYMENT_SERVICE_URL}/api/payments/${payment._id}/refund`);
      return { success: true, ...refundResponse.data };
    } catch (error) {
      console.error('Error refunding payment:', error.message);
      return { success: false };
    }
  }
}

module.exports = new ServiceClient();
