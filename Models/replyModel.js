const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const Reply = mongoose.model('Reply', replySchema);
module.exports = Reply;