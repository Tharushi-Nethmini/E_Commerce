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
exports.createSupplierPayment = async (req, res) => {
  try {
    const { restockRequestId, supplierId, amount, paymentMethod, bankDetails } = req.body;
    if (!restockRequestId || !supplierId || !amount || !paymentMethod) {
      console.error('[SupplierPayment] Missing required fields:', { restockRequestId, supplierId, amount, paymentMethod });
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    // Create payment record
    const payment = await SupplierPayment.create({
      restockRequestId,
      supplierId,
      amount,
      paymentMethod,
      bankDetails,
      status: 'PAID',
      paidAt: new Date()
    });

    // Mark restock request as PAID (if model exists)
    if (RestockRequest) {
      try {
        const updateResult = await RestockRequest.findByIdAndUpdate(restockRequestId, { status: 'PAID' });
        if (!updateResult) {
          console.error('[SupplierPayment] RestockRequest not found for ID:', restockRequestId);
        }
      } catch (err) {
        console.error('[SupplierPayment] Error updating RestockRequest:', err);
      }
    } else {
      console.error('[SupplierPayment] RestockRequest model not loaded.');
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error('[SupplierPayment] Error creating supplier payment:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all supplier payments (admin or supplier view)
exports.getSupplierPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.supplierId) filter.supplierId = req.query.supplierId;
    const payments = await SupplierPayment.find(filter).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
