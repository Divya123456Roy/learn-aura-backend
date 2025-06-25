const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Add userId
}, { timestamps: true });

const DiscussionForum = mongoose.model('DiscussionForum', forumSchema);
module.exports = DiscussionForum;