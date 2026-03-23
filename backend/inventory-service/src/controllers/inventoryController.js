
const inventoryService = require('../services/inventoryService');

class InventoryController {
  // Get only paid restock requests (for admin payments)
  async getPaidRestockRequests(req, res) {
    try {
      const paid = await inventoryService.getRestockRequests({ status: 'PAID' });
      res.status(200).json(paid);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Admin marks a fulfilled restock request as paid
  async payRestockRequest(req, res) {
    try {
      const requestId = req.params.id;
      const updated = await inventoryService.payRestockRequest(requestId);
      res.status(200).json({ message: 'Restock request marked as paid', restockRequest: updated });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get only fulfilled restock requests (for admin payments)
  async getFulfilledRestockRequests(req, res) {
    try {
      const fulfilled = await inventoryService.getRestockRequests({ status: 'FULFILLED' });
      res.status(200).json(fulfilled);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Supplier fulfills a restock request
  async fulfillRestockRequest(req, res) {
    try {
      const requestId = req.params.id;
      const user = req.user;
      // Optionally: check if supplier owns the product in the request
      const updated = await inventoryService.fulfillRestockRequest(requestId, user ? user.userId : null);
      res.status(200).json({ message: 'Restock request fulfilled', restockRequest: updated });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

    // Get restock requests (admin: all, supplier: only their products)
    async getRestockRequests(req, res) {
      try {
        let supplierId = null;
        if (req.user && req.user.role === 'SUPPLIER') {
          supplierId = req.user.userId;
        }
        const restockRequests = await inventoryService.getRestockRequests({ supplierId });
        res.status(200).json(restockRequests);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  // Admin restock request
  async createRestockRequest(req, res) {
    try {
      const { productId, quantity } = req.body;
      if (!productId || !quantity) {
        return res.status(400).json({ message: 'Product and quantity are required' });
      }
      // Use req.user if you want to track who requested
      const requestedBy = req.user ? req.user.userId : null;
      const restockRequest = await inventoryService.createRestockRequest({ productId, quantity, requestedBy });
      res.status(201).json({ message: 'Restock request submitted', restockRequest });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
  // Approve product (admin only)
  async approveProduct(req, res) {
    try {
      const product = await inventoryService.approveProduct(req.params.id);
      res.status(200).json({ message: 'Product approved', product });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Reject product (admin only)
  async rejectProduct(req, res) {
    try {
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }
      const product = await inventoryService.rejectProduct(req.params.id, reason);
      res.status(200).json({ message: 'Product rejected', product });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
  // Create product
  async createProduct(req, res) {
    try {
      let productData = req.body;
      if (req.user && req.user.role === 'SUPPLIER') {
        // Use userId from JWT payload
        productData.supplier = req.user.userId;
        // Default status is PENDING for supplier products (admin must approve)
        productData.status = 'PENDING';
      }
      const product = await inventoryService.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get product by ID
  async getProductById(req, res) {
    try {
      const product = await inventoryService.getProductById(req.params.id);
      res.status(200).json(product);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Get all products or by category, with role-based filtering
  async getAllProducts(req, res) {
    try {
      const { category, status, supplier } = req.query;
      let user = req.user;
      let filter = {};
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (supplier) filter.supplier = supplier;

      // Role-based filtering
      if (user) {
        if (user.role === 'SUPPLIER') {
          const mongoose = require('mongoose');
          try {
            console.log("[DEBUG] Supplier filter user.userId:", user.userId);
            filter.supplier = new mongoose.Types.ObjectId(user.userId);
          } catch (err) {
            console.error('[ERROR] Invalid userId for ObjectId:', user.userId, err.message);
            return res.status(400).json({ message: `Invalid supplier userId: ${user.userId}`, userId: user.userId });
          }
        } else if (user.role === 'CUSTOMER') {
          filter.status = 'ACTIVE';
        }
        // Admin sees all
      } else {
        // Unauthenticated: only show ACTIVE
        filter.status = 'ACTIVE';
      }
      console.log("[DEBUG] Final filter for products:", filter);

      const products = await inventoryService.getProductsByFilter(filter);
      res.status(200).json(products);
    } catch (error) {
      console.error('[ERROR] getAllProducts:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Update product
  async updateProduct(req, res) {
    try {
      // Only allow supplier to update their own product
      if (req.user.role === 'SUPPLIER') {
        const product = await inventoryService.getProductById(req.params.id);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
        if (String(product.supplier) !== String(req.user.userId)) {
          return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
      }
      const updatedProduct = await inventoryService.updateProduct(req.params.id, req.body);
      res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Delete product
  async deleteProduct(req, res) {
    try {
      // Only allow supplier to delete their own product
      if (req.user.role === 'SUPPLIER') {
        const product = await inventoryService.getProductById(req.params.id);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
        if (String(product.supplier) !== String(req.user.userId)) {
          return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
      }
      const result = await inventoryService.deleteProduct(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Check stock (inter-service endpoint)
  async checkStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const result = await inventoryService.checkStock(productId, quantity);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Reserve stock (inter-service endpoint)
  async reserveStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const result = await inventoryService.reserveStock(productId, quantity);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Confirm stock (inter-service endpoint)
  async confirmStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const result = await inventoryService.confirmStock(productId, quantity);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Release stock (inter-service endpoint)
  async releaseStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const result = await inventoryService.releaseStock(productId, quantity);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Upload product image
  async uploadProductImage(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const result = await inventoryService.uploadProductImage(id, req.file);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Delete product image
  async deleteProductImage(req, res) {
    try {
      const { id } = req.params;
      const result = await inventoryService.deleteProductImage(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get low stock products
  async getLowStockProducts(req, res) {
    try {
      const threshold = parseInt(req.query.threshold) || 10;
      const products = await inventoryService.getLowStockProducts(threshold);
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new InventoryController();
