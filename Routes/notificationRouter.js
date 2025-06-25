// notificationRoutes.js
const express = require('express');
const notificationRouter = express.Router();
const notificationController = require('../Controllers/notificationController');
const { protect, authorize } = require('../Middlewares/authMiddleware');

// Protected Routes
notificationRouter.post('/', protect, notificationController.createNotification);
notificationRouter.get('/', protect, notificationController.getUserNotifications);
notificationRouter.put('/:id/read', protect, notificationController.markNotificationAsRead);
notificationRouter.delete('/', protect, notificationController.deleteAllNotifications);
notificationRouter.get('/all', protect, authorize('admin'), notificationController.getAllNotifications);

module.exports = notificationRouter;