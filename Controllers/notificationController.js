const asyncHandler = require('express-async-handler');
const Notification = require('../Models/notificationModel');

const notificationController = {
  // Create a new notification
  createNotification: asyncHandler(async (req, res) => {
    const { userId, message, type, relatedItemId } = req.body;

    if (!userId || !message || !type) {
      return res.status(400).json({ message: 'UserId, message, and type are required' });
    }

    const notification = new Notification({
      userId,
      message,
      type,
      relatedItemId,
    });

    const createdNotification = await notification.save();
    res.status(201).json(createdNotification);
  }),

  // Get all notifications for a user with pagination
  getUserNotifications: asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 }) // Sort by latest first
        .skip(skip)
        .limit(limit)
        .populate('relatedItemId');

      const totalNotifications = await Notification.countDocuments({ userId: req.user._id });

      if (!notifications.length && page === 1) {
        return res.status(404).json({ message: "No notifications found" });
      }

      res.json({
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalNotifications / limit),
          totalNotifications,
          limit,
        },
      });
    } catch (error) {
      console.log("Error on notification:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }),

  // Mark a notification as read
  markNotificationAsRead: asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to mark this notification as read' });
    }

    notification.isRead = true;
    await notification.save();
    res.json({ message: 'Notification marked as read' });
  }),

  // Delete all notifications for the authenticated user
  deleteAllNotifications: asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id });

    if (notifications.length === 0) {
      return res.status(404).json({ message: 'No notifications found to delete' });
    }

    await Notification.deleteMany({ userId: req.user._id });
    res.json({ message: 'All notifications deleted' });
  }),

  // Get all notifications (admin only)
  getAllNotifications: asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to access all notifications" });
    }
    const notifications = await Notification.find().populate('userId');
    res.json(notifications);
  }),

  // Optional: Delete a single notification by ID (if needed)
  /*
  deleteNotification: asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this notification' });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  }),
  */
};

module.exports = notificationController;