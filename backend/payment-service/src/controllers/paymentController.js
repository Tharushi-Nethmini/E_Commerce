const paymentService = require('../services/paymentService');

class PaymentController {
  // Process payment
  async processPayment(req, res) {
    try {
      const result = await paymentService.processPayment(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get payment by ID
  async getPaymentById(req, res) {
    try {
      const payment = await paymentService.getPaymentById(req.params.id);
      res.status(200).json(payment);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Get payment by order ID
  async getPaymentByOrderId(req, res) {
    try {
      const payment = await paymentService.getPaymentByOrderId(req.params.orderId);
      res.status(200).json(payment);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Get all payments
  async getAllPayments(req, res) {
    try {
      const payments = await paymentService.getAllPayments();
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get payment history with filters
  async getPaymentHistory(req, res) {
    try {
      const result = await paymentService.getPaymentHistory(req.query);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Refund payment
  async refundPayment(req, res) {
    try {
      const result = await paymentService.refundPayment(req.params.id, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get refund status by payment ID
  async getRefundStatus(req, res) {
    try {
      const result = await paymentService.getRefundStatus(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Create payment method
  async createPaymentMethod(req, res) {
    try {
      const method = await paymentService.createPaymentMethod(req.body);
      res.status(201).json(method);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get payment methods by user ID
  async getPaymentMethodsByUserId(req, res) {
    try {
      const methods = await paymentService.getPaymentMethodsByUserId(req.params.userId);
      res.status(200).json(methods);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Update payment method
  async updatePaymentMethod(req, res) {
    try {
      const method = await paymentService.updatePaymentMethod(req.params.methodId, req.body);
      res.status(200).json(method);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Delete payment method
  async deletePaymentMethod(req, res) {
    try {
      const result = await paymentService.deletePaymentMethod(req.params.methodId);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Generate invoice
  async generateInvoice(req, res) {
    try {
      const invoice = await paymentService.generateInvoice(req.params.id);
      res.status(200).json(invoice);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get payment status (inter-service endpoint)
  async getPaymentStatus(req, res) {
    try {
      const { orderId } = req.body;
      const result = await paymentService.getPaymentStatus(orderId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new PaymentController();
