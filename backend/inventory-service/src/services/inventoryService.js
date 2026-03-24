const RestockRequest = require('../models/RestockRequest');
const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');
const { createLowStockNotification } = require('./notificationService');

class InventoryService {
  // Delete a restock request by ID
  async deleteRestockRequest(requestId) {
    const deleted = await RestockRequest.findByIdAndDelete(requestId);
    if (!deleted) throw new Error('Restock request not found');
    return deleted;
  }

  // Admin marks a fulfilled restock request as paid
  async payRestockRequest(requestId) {
    const request = await RestockRequest.findById(requestId);
    if (!request) throw new Error('Restock request not found');
    if (request.status !== 'FULFILLED' && request.status !== 'PAID') throw new Error('Only fulfilled or already paid requests can be paid');
    request.status = 'PAID';
    await request.save();
    return request;
  }

      // Supplier fulfills a restock request
      async fulfillRestockRequest(requestId, supplierId) {
        const request = await RestockRequest.findById(requestId).populate('productId');
        if (!request) throw new Error('Restock request not found');
        if (request.status !== 'PENDING') throw new Error('Request is not pending');
        // Optionally: check supplier owns the product
        if (supplierId && request.productId && request.productId.supplier && String(request.productId.supplier) !== String(supplierId)) {
          throw new Error('You do not have permission to fulfill this request');
        }
        request.status = 'FULFILLED';
        await request.save();
        return request;
      }
    // Get all restock requests, optionally filtered by supplier
    async getRestockRequests({ supplierId, status } = {}) {
      const filter = {};
      if (supplierId) {
        const products = await Product.find({ supplier: supplierId }, '_id');
        filter.productId = { $in: products.map(p => p._id) };
      }
      if (status) filter.status = status;
      return await RestockRequest.find(filter).populate('productId').sort({ createdAt: -1 });
    }
  // Create a restock request (admin)
  async createRestockRequest({ productId, quantity, requestedBy }) {
    if (!productId || !quantity) {
      throw new Error('Product and quantity are required');
    }
    const restockRequest = new RestockRequest({ productId, quantity, requestedBy });
    await restockRequest.save();
    return restockRequest;
  }
      // Approve product (set status to ACTIVE)
      async approveProduct(productId) {
        const product = await Product.findById(productId);
        if (!product) throw new Error('Product not found');
        product.status = 'ACTIVE';
        product.rejectionReason = null;
        await product.save();
        return product;
      }

      // Reject product (set status to REJECTED with reason)
      async rejectProduct(productId, reason) {
        const product = await Product.findById(productId);
        if (!product) throw new Error('Product not found');
        product.status = 'REJECTED';
        product.rejectionReason = reason;
        await product.save();
        return product;
      }
    // Get products by filter (used for supplier/admin/customer role-based queries)
    async getProductsByFilter(filter) {
      try {
        return await Product.find(filter).sort({ createdAt: -1 });
      } catch (error) {
        throw error;
      }
    }
  // Create product
  async createProduct(productData) {
    try {
      const existingProduct = await Product.findOne({ sku: productData.sku });
      if (existingProduct) {
        throw new Error('Product with this SKU already exists');
      }

      const product = new Product(productData);
      await product.save();
      return product;
    } catch (error) {
      throw error;
    }
  }

  // Get product by ID
  async getProductById(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      throw error;
    }
  }

  // Get all products
  async getAllProducts() {
    try {
      return await Product.find().sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Get products by category
  async getProductsByCategory(category) {
    try {
      return await Product.find({ category }).sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Get low stock products (for analytics)
  async getLowStockProducts(threshold = 10) {
    try {
      return await Product.find({
        quantity: { $lte: threshold },
        available: true
      }).sort({ quantity: 1 });
    } catch (error) {
      throw error;
    }
  }

  // Update product
  async updateProduct(productId, updateData) {
    try {
      // Coerce price and quantity to numbers if present
      const update = { ...updateData, updatedAt: new Date() };
      if (update.price !== undefined) update.price = Number(update.price);
      if (update.quantity !== undefined) update.quantity = Number(update.quantity);

      // If quantity is being updated, reset reservedQuantity to 0
      if (update.quantity !== undefined) {
        update.reservedQuantity = 0;
      }

      const product = await Product.findByIdAndUpdate(
        productId,
        update,
        { new: true, runValidators: true }
      );

      if (!product) {
        throw new Error('Product not found');
      }

      // Debug log: print updated quantity and reservedQuantity
      console.log(`[DEBUG] Product updated: id=${productId}, quantity=${product.quantity}, reservedQuantity=${product.reservedQuantity}`);

      return product;
    } catch (error) {
      throw error;
    }
  }

  // Delete product
  async deleteProduct(productId) {
    try {
      const product = await Product.findByIdAndDelete(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      return { message: 'Product deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Check stock availability (for inter-service communication)
  async checkStock(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        return {
          available: false,
          message: 'Product not found',
          productId
        };
      }

      if (!product.available) {
        return {
          available: false,
          message: 'Product is not available',
          productId,
          productName: product.name
        };
      }

      const availableQuantity = product.quantity - product.reservedQuantity;
      
      if (availableQuantity < quantity) {
        return {
          available: false,
          message: 'Insufficient stock',
          productId,
          productName: product.name,
          requestedQuantity: quantity,
          availableQuantity
        };
      }

      return {
        available: true,
        message: 'Stock available',
        productId,
        productName: product.name,
        price: product.price,
        requestedQuantity: quantity,
        availableQuantity
      };
    } catch (error) {
      throw error;
    }
  }

  // Reserve stock (for order processing)
  async reserveStock(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      const availableQuantity = product.quantity - product.reservedQuantity;
      
      if (availableQuantity < quantity) {
        throw new Error('Insufficient stock to reserve');
      }

      product.reservedQuantity += quantity;
      await product.save();

      return {
        success: true,
        message: 'Stock reserved successfully',
        productId,
        reservedQuantity: quantity,
        totalReserved: product.reservedQuantity
      };
    } catch (error) {
      throw error;
    }
  }

  // Confirm stock (deduct from inventory after payment)
  async confirmStock(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      if (product.reservedQuantity < quantity) {
        throw new Error('Reserved quantity mismatch');
      }
      product.quantity -= quantity;
      product.reservedQuantity -= quantity;
      await product.save();

      // DEBUG LOGGING
      console.log('[CONFIRM STOCK] Product:', {
        id: product._id,
        name: product.name,
        supplier: product.supplier,
        quantity: product.quantity,
        reservedQuantity: product.reservedQuantity,
        lowStockThreshold: product.lowStockThreshold,
        lowStockNotified: product.lowStockNotified
      });

      // LOW STOCK IN-APP NOTIFICATION LOGIC
      if (
        product.supplier &&
        product.quantity <= product.lowStockThreshold &&
        !product.lowStockNotified
      ) {
        console.log('[CONFIRM STOCK] Creating low stock notification for supplier:', product.supplier);
        await createLowStockNotification({
          userId: product.supplier,
          productName: product.name,
          quantity: product.quantity,
          threshold: product.lowStockThreshold
        });
        product.lowStockNotified = true;
        await product.save();
      }
      // Reset notification flag if stock is replenished above threshold
      if (product.quantity > product.lowStockThreshold && product.lowStockNotified) {
        product.lowStockNotified = false;
        await product.save();
      }
      return {
        success: true,
        message: 'Stock confirmed and deducted',
        productId,
        deductedQuantity: quantity,
        remainingQuantity: product.quantity
      };
    } catch (error) {
      throw error;
    }
  }

  // Release reserved stock (if order fails)
  async releaseStock(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      product.reservedQuantity = Math.max(0, product.reservedQuantity - quantity);
      await product.save();

      return {
        success: true,
        message: 'Reserved stock released',
        productId,
        releasedQuantity: quantity
      };
    } catch (error) {

        // LOW STOCK IN-APP NOTIFICATION LOGIC (if quantity is updated)
        if (
          typeof updateData.quantity === 'number' &&
          product.supplier
        ) {
          // If stock drops to or below threshold and not notified
          if (
            product.quantity <= product.lowStockThreshold &&
            !product.lowStockNotified
          ) {
            await createLowStockNotification({
              userId: product.supplier,
              productName: product.name,
              quantity: product.quantity,
              threshold: product.lowStockThreshold
            });
            product.lowStockNotified = true;
          }
          // Reset notification flag if stock is replenished above threshold
          if (product.quantity > product.lowStockThreshold && product.lowStockNotified) {
            product.lowStockNotified = false;
          }
        }

      throw error;
    }
  }

  // Upload product image to Cloudinary
  async uploadProductImage(productId, file) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Delete old image if exists
      if (product.imagePublicId) {
        await cloudinary.uploader.destroy(product.imagePublicId);
      }

      // Upload new image
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'ecommerce-products',
            transformation: [
              { width: 800, height: 800, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      // Update product with new image URL
      product.imageUrl = result.secure_url;
      product.imagePublicId = result.public_id;
      await product.save();

      return {
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: product.imageUrl,
        product
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete product image from Cloudinary
  async deleteProductImage(productId) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.imagePublicId) {
        throw new Error('Product has no image to delete');
      }

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(product.imagePublicId);

      // Remove from product
      product.imageUrl = null;
      product.imagePublicId = null;
      await product.save();

      return {
        success: true,
        message: 'Image deleted successfully',
        product
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new InventoryService();
