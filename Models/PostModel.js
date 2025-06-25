const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  forumId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionForum', required: true },
  content: { type: String, required: true },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reply' }],
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;