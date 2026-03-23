const Payment = require('../models/Payment');
const PaymentMethod = require('../models/PaymentMethod');
const { v4: uuidv4 } = require('uuid');

class PaymentService {
  // Process payment (called by Order Service)
  async processPayment(paymentData) {
    try {
      const { userId, orderId, amount, paymentMethod } = paymentData;

      // Create payment record
      const payment = new Payment({
        userId,
        orderId,
        amount,
        paymentMethod,
        status: 'PROCESSING'
      });

      await payment.save();

      // Simulate payment processing
      // In production, this would integrate with payment gateway (Stripe, PayPal, etc.)
      const paymentResult = await this.simulatePaymentGateway(payment);

      if (paymentResult.success) {
        payment.status = 'COMPLETED';
        payment.transactionId = paymentResult.transactionId;
        payment.processedAt = new Date();
      } else {
        payment.status = 'FAILED';
        payment.failureReason = paymentResult.reason;
      }

      await payment.save();

      return {
        success: paymentResult.success,
        paymentId: payment._id,
        transactionId: payment.transactionId,
        status: payment.status,
        message: paymentResult.success ? 'Payment processed successfully' : paymentResult.reason
      };
    } catch (error) {
      throw error;
    }
  }

  // Simulate payment gateway processing
  async simulatePaymentGateway(payment) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 90% success rate for simulation
        const success = Math.random() > 0.1;
        
        if (success) {
          resolve({
            success: true,
            transactionId: `TXN-${uuidv4()}`
          });
        } else {
          const reasons = [
            'Insufficient funds',
            'Card declined',
            'Payment gateway timeout',
            'Invalid card details'
          ];
          resolve({
            success: false,
            reason: reasons[Math.floor(Math.random() * reasons.length)]
          });
        }
      }, 1000); // Simulate processing delay
    });
  }

  // Get payment by ID
  async getPaymentById(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }
      return payment;
    } catch (error) {
      throw error;
    }
  }

  // Get payment by order ID
  async getPaymentByOrderId(orderId) {
    try {
      const payment = await Payment.findOne({ orderId });
      if (!payment) {
        throw new Error('Payment not found for this order');
      }
      return payment;
    } catch (error) {
      throw error;
    }
  }

  // Get all payments
  async getAllPayments() {
    try {
      return await Payment.find().sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Payment history with filters and pagination
  async getPaymentHistory(query) {
    try {
      const {
        userId,
        orderId,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 10
      } = query;

      const filters = {};

      if (userId) {
        filters.userId = userId;
      }

      if (orderId) {
        filters.orderId = orderId;
      }

      if (status) {
        filters.status = status;
      }

      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) {
          filters.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          filters.createdAt.$lte = new Date(endDate);
        }
      }

      const numericPage = Math.max(parseInt(page, 10) || 1, 1);
      const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

      const [payments, totalCount] = await Promise.all([
        Payment.find(filters)
          .sort({ createdAt: -1 })
          .skip((numericPage - 1) * numericLimit)
          .limit(numericLimit),
        Payment.countDocuments(filters)
      ]);

      return {
        data: payments,
        pagination: {
          page: numericPage,
          limit: numericLimit,
          totalCount,
          totalPages: Math.ceil(totalCount / numericLimit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentId, refundData = {}) {
    try {
      const payment = await Payment.findById(paymentId);
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Only completed payments can be refunded');
      }

      if (payment.refund && payment.refund.status !== 'NONE') {
        throw new Error('Refund has already been processed or requested for this payment');
      }

      const refundAmount = refundData.amount ? Number(refundData.amount) : payment.amount;

      if (Number.isNaN(refundAmount) || refundAmount <= 0) {
        throw new Error('Refund amount must be greater than 0');
      }

      if (refundAmount > payment.amount) {
        throw new Error('Refund amount cannot exceed original payment amount');
      }

      payment.status = 'REFUNDED';
      payment.refund = {
        status: 'REFUNDED',
        reason: refundData.reason,
        amount: refundAmount,
        requestedAt: new Date(),
        refundedAt: new Date()
      };
      payment.updatedAt = new Date();
      await payment.save();

      return {
        success: true,
        message: 'Payment refunded successfully',
        paymentId: payment._id,
        refund: payment.refund
      };
    } catch (error) {
      throw error;
    }
  }

  // Get refund status by payment ID
  async getRefundStatus(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      return {
        paymentId: payment._id,
        paymentStatus: payment.status,
        refund: payment.refund || { status: 'NONE' }
      };
    } catch (error) {
      throw error;
    }
  }

  // Create payment method
  async createPaymentMethod(data) {
    try {
      const paymentMethod = new PaymentMethod(data);

      if (paymentMethod.isDefault) {
        await PaymentMethod.updateMany(
          { userId: paymentMethod.userId, isDefault: true },
          { $set: { isDefault: false } }
        );
      }

      await paymentMethod.save();
      return paymentMethod;
    } catch (error) {
      throw error;
    }
  }

  // Get payment methods by user
  async getPaymentMethodsByUserId(userId) {
    try {
      return await PaymentMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Update payment method
  async updatePaymentMethod(methodId, data) {
    try {
      const existingMethod = await PaymentMethod.findById(methodId);

      if (!existingMethod) {
        throw new Error('Payment method not found');
      }

      if (data.isDefault) {
        await PaymentMethod.updateMany(
          { userId: existingMethod.userId, _id: { $ne: methodId }, isDefault: true },
          { $set: { isDefault: false } }
        );
      }

      Object.assign(existingMethod, data);
      await existingMethod.save();
      return existingMethod;
    } catch (error) {
      throw error;
    }
  }

  // Delete payment method
  async deletePaymentMethod(methodId) {
    try {
      const deletedMethod = await PaymentMethod.findByIdAndDelete(methodId);

      if (!deletedMethod) {
        throw new Error('Payment method not found');
      }

      return {
        success: true,
        message: 'Payment method deleted successfully',
        methodId
      };
    } catch (error) {
      throw error;
    }
  }

  // Generate invoice data by payment ID
  async generateInvoice(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (!['COMPLETED', 'REFUNDED'].includes(payment.status)) {
        throw new Error('Invoice can only be generated for completed or refunded payments');
      }

      const invoiceNumber = `INV-${payment._id.toString().slice(-8).toUpperCase()}`;

      return {
        invoiceNumber,
        generatedAt: new Date().toISOString(),
        payment: {
          paymentId: payment._id,
          transactionId: payment.transactionId,
          orderId: payment.orderId,
          userId: payment.userId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
          processedAt: payment.processedAt,
          refundedAmount: payment.refund?.amount || 0
        },
        summary: {
          grossAmount: payment.amount,
          refundAmount: payment.refund?.amount || 0,
          netAmount: payment.amount - (payment.refund?.amount || 0)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get payment status (for inter-service communication)
  async getPaymentStatus(orderId) {
    try {
      const payment = await Payment.findOne({ orderId });
      
      if (!payment) {
        return {
          exists: false,
          status: null
        };
      }

      return {
        exists: true,
        status: payment.status,
        paymentId: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PaymentService();
