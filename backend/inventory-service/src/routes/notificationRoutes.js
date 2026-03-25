const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { getUserNotifications, markNotificationRead } = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

// Delete a notification by ID (supplier can remove)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    // Only allow the owner to delete
    if (String(notification.user) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all notifications for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.userId);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark a notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await markNotificationRead(req.params.id);
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
