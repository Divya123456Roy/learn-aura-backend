// replyController.js
const Reply = require('../Models/replyModel');
const Post = require('../Models/PostModel');
const asyncHandler = require('express-async-handler');
const User = require('../Models/userModel');
const { default: mongoose } = require('mongoose');
const Feed = require('../Models/feedModel');

const replyController = {
  // Create a new reply
  createReply: asyncHandler(async (req, res) => {
    const { content, postId } = req.body;

    if (!content || !postId) {
      return res.status(400).json({ message: 'Content and postId are required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const reply = new Reply({
      content,
      postId,
      userId: req.user._id,
    });

    const createdReply = await reply.save();

    post.replies.push(createdReply._id);
    await post.save();

    const user = await User.findById(req.user._id);
    const followers = user.followingUsers;
    const friends = user.friends;

    const postUser = await User.findById(post.userId);

    let userIds = [...followers, ...friends, req.user._id, postUser._id];
    userIds = [...new Set(userIds.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));

    for (const userId of userIds) {
      let feed = await Feed.findOne({ userId: userId });
      if (!feed) {
        feed = new Feed({ userId: userId, feedItems: [] });
      }
      feed.feedItems.unshift({ type: 'reply', itemId: createdReply._id });
      await feed.save();
    }

    res.status(201).json(createdReply);
  }),

  // Get all replies
  getAllReplies: asyncHandler(async (req, res) => {
    const replies = await Reply.find().populate('userId postId');
    res.json(replies);
  }),

  // Get reply by ID
  getReplyById: asyncHandler(async (req, res) => {
    const reply = await Reply.findById(req.params.id).populate('userId postId');
    if (reply) {
      res.json(reply);
    } else {
      res.status(404).json({ message: 'Reply not found' });
    }
  }),

  // Update reply (only creator or admin)
  updateReply: asyncHandler(async (req, res) => {
    const reply = await Reply.findById(req.params.id);

    if (reply) {
      if (req.user.role !== 'admin' && reply.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to update this reply' });
      }

      reply.content = req.body.content || reply.content;

      const updatedReply = await reply.save();
      res.json(updatedReply);
    } else {
      res.status(404).json({ message: 'Reply not found' });
    }
  }),

  // Delete reply (only creator or admin)
  deleteReply: asyncHandler(async (req, res) => {
    const reply = await Reply.findById(req.params.id);

    if (reply) {
      if (req.user.role !== 'admin' && reply.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to delete this reply' });
      }

      await Reply.findByIdAndDelete(req.params.id)
      res.json({ message: 'Reply removed' });
    } else {
      res.status(404).json({ message: 'Reply not found' });
    }
  }),

  // Get replies by post ID
  getRepliesByPostId: asyncHandler(async (req, res) => {
    const replies = await Reply.find({ postId: req.params.postId }).populate('userId postId');
    res.json(replies);
  }),

  // Get replies by user ID
  getRepliesByUserId: asyncHandler(async (req, res) => {
    const replies = await Reply.find({ userId: req.params.userId }).populate('userId postId');
    res.json(replies);
  }),
};

module.exports = replyController;