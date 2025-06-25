const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Optional
  type: {
    type: String,
    enum: [
      'friendRequest',
      'friendRequestAccepted',
      'newMessage',
      'groupInvitation',
      'groupJoined',
      'courseEnrollment',
      'assignmentGraded',
      'newPost',
      'badgeEarned',
      'pointsAwarded',
      'resourceShared',
      'courseBrought',
      'newFollower'
    ],
    required: true,
  },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedItemId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Optional: ID of related item (e.g., message, group, course)
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;