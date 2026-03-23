const express = require('express');
const router = express.Router();
const { getUserNotifications, markNotificationRead } = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

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
