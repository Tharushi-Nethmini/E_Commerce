const Notification = require('../models/Notification');

async function createLowStockNotification({ userId, productName, quantity, threshold }) {
  return Notification.create({
    user: userId,
    type: 'LOW_STOCK',
    title: 'Low Stock Alert',
    message: `Stock for ${productName} is low (${quantity} left, threshold: ${threshold})`,
    read: false
  });
}


async function createRestockNotification({ userId, productName, quantity }) {
  return Notification.create({
    user: userId,
    type: 'INFO',
    title: 'Restock Requested',
    message: `Admin has requested a restock for ${productName} (Quantity: ${quantity})`,
    read: false
  });
}

async function getUserNotifications(userId) {
  return Notification.find({ user: userId }).sort({ createdAt: -1 });
}

async function markNotificationRead(notificationId) {
  return Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
}

module.exports = {
  createLowStockNotification,
  createRestockNotification,
  getUserNotifications,
  markNotificationRead
};
