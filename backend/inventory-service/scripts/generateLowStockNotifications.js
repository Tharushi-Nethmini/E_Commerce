// Run this script with: node scripts/generateLowStockNotifications.js
// Make sure your DB connection string is set in environment or hardcode below

const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Notification = require('../src/models/Notification');
const { createLowStockNotification } = require('../src/services/notificationService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory-service';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const products = await Product.find({
    quantity: { $lte: 10 },
    lowStockNotified: { $ne: true },
    supplier: { $exists: true, $ne: null }
  });

  for (const product of products) {
    await createLowStockNotification({
      userId: product.supplier,
      productName: product.name,
      quantity: product.quantity,
      threshold: product.lowStockThreshold || 10
    });
    product.lowStockNotified = true;
    await product.save();
    console.log(`Notification created for product: ${product.name} (Supplier: ${product.supplier})`);
  }

  console.log('Done.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
