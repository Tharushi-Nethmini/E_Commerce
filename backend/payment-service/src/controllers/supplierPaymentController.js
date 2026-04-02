const SupplierPayment = require('../models/SupplierPayment');
let RestockRequest;
try {
  RestockRequest = require('../../../inventory-service/src/models/RestockRequest');
} catch (e) {
  try {
    RestockRequest = require('../../../../inventory-service/src/models/RestockRequest');
  } catch (e2) {
    try {
      RestockRequest = require('../../../../backend/inventory-service/src/models/RestockRequest');
    } catch (e3) {
      RestockRequest = null;
    }
  }
}

// Create a supplier payment (admin pays supplier for restock)
const axios = require('axios');
exports.createSupplierPayment = async (req, res) => {
  try {
    const { restockRequestId, supplierId, amount, paymentMethod, bankDetails } = req.body;
    if (!restockRequestId || !supplierId || !amount || !paymentMethod) {
      console.error('[SupplierPayment] Missing required fields:', { restockRequestId, supplierId, amount, paymentMethod });
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    // Mark restock request as PAID via inventory-service API first.
    // Prefer the current caller's auth token, fall back to ADMIN_TOKEN.
    const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:8082';
    const requestAuthHeader = req.headers?.authorization;
    const adminToken = process.env.ADMIN_TOKEN;

    const headers = {};
    if (requestAuthHeader) {
      headers.Authorization = requestAuthHeader;
    } else if (adminToken) {
      headers.Authorization = `Bearer ${adminToken}`;
    }

    await axios.patch(
      `${inventoryServiceUrl}/api/inventory/restock-requests/${restockRequestId}/pay`,
      {},
      { headers }
    );

    // Create payment record only after restock status update succeeds.
    const payment = await SupplierPayment.create({
      restockRequestId,
      supplierId,
      amount,
      paymentMethod,
      bankDetails,
      status: 'PAID',
      paidAt: new Date()
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('[SupplierPayment] Error creating supplier payment:', error);
    const backendMessage = error?.response?.data?.message;
    res.status(400).json({ message: backendMessage || error.message });
  }
};

// Get all supplier payments (admin or supplier view)
exports.getSupplierPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.supplierId) filter.supplierId = req.query.supplierId;
    // Populate restockRequestId and its productId for product details
    const payments = await SupplierPayment.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: 'restockRequestId',
        populate: { path: 'productId' }
      });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
