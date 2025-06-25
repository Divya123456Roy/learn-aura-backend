// postController.js
const DiscussionForum = require('../Models/discussionForumModel');
const asyncHandler = require('express-async-handler');
const Post = require('../Models/postModel');
const User = require('../Models/userModel');
const Feed = require('../Models/feedModel');

const postController = {
  // Create a new post
  createPost: asyncHandler(async (req, res) => {
    const { content, forumId } = req.body;

    if (!content || !forumId) {
      return res.status(400).json({ message: 'Content and forumId are required' });
    }

    const forum = await DiscussionForum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    const post = new Post({
      content,
      forumId,
      userId: req.user._id,
    });

    const createdPost = await post.save();

    // Update Feeds
    const user = await User.findById(req.user._id);
    const followers = user.followingUsers;
    const friends = user.friends;

    const userIds = [...followers, ...friends, req.user._id];

    for (const userId of userIds) {
      let feed = await Feed.findOne({ userId: userId });
      if (!feed) {
        feed = new Feed({ userId: userId, feedItems: [] });
      }
      feed.feedItems.unshift({ type: 'post', itemId: createdPost._id });
      await feed.save();
    }

    res.status(201).json(createdPost);
  }),

  // Get all posts
  getAllPosts: asyncHandler(async (req, res) => {
    const posts = await Post.find().populate('userId forumId');
    res.json(posts);
  }),

  // Get post by ID
  getPostById: asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id).populate('userId forumId');
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  }),

  // Update post (only creator or admin)
  updatePost: asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (post) {
      if (req.user.role !== 'admin' && post.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to update this post' });
      }

      post.content = req.body.content || post.content;

      const updatedPost = await post.save();
      res.json(updatedPost);
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  }),

  // Delete post (only creator or admin)
  deletePost: asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (post) {
      if (req.user.role !== 'admin' && post.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to delete this post' });
      }

      await Post.findByIdAndDelete(req.params.id)
      res.json({ message: 'Post removed' });
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  }),

  // Get posts by forum ID
  getPostsByForumId: asyncHandler(async (req, res) => {
    const posts = await Post.find({ forumId: req.params.forumId }).populate('userId forumId');
    res.json(posts);
  }),

  // Get posts by user ID
  getPostsByUserId: asyncHandler(async (req, res) => {
    const posts = await Post.find({ userId: req.params.userId }).populate('userId forumId');
    res.json(posts);
  }),
};

module.exports = postController;