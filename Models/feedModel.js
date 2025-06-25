const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  replies: [{
    type: {type: String,},
    discussionId: { type: mongoose.Schema.Types.ObjectId, required: true, ref:"DiscussionForum" },
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

const Feed = mongoose.model('Feed', feedSchema);
module.exports = Feed;