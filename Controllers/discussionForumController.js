const asyncHandler = require('express-async-handler');
const DiscussionForum = require('../Models/discussionForumModel');
const Reply = require('../Models/replyModel');
const User = require('../Models/userModel'); // Assuming you have a User model

const discussionController = {
  // 1. Create a new discussion
  createDiscussion: asyncHandler(async (req, res) => {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const discussion = new DiscussionForum({
      title,
      userId: req.user._id,
    });

    const createdDiscussion = await discussion.save();
    res.status(201).json(createdDiscussion);
  }),


  // 3. Edit discussion by the author
  editDiscussion: asyncHandler(async (req, res) => {
    const discussion = await DiscussionForum.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    if (discussion.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to edit this discussion' });
    }

    discussion.title = req.body.title || discussion.title;

    const updatedDiscussion = await discussion.save();
    res.json(updatedDiscussion);
  }),

  // 4. Delete discussion by the author
  deleteDiscussion: asyncHandler(async (req, res) => {
    const discussion = await DiscussionForum.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    if (discussion.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this discussion' });
    }

    // Delete associated replies
    await Reply.deleteMany({ 'reply.discussionId': discussion._id });
    await discussion.deleteOne();
    res.json({ message: 'Discussion and associated replies removed' });
  }),

  // 5. Create a reply
  createReply: asyncHandler(async (req, res) => {
    const { discussionId, content } = req.body;

    console.log(req.body);
    

    if  (!discussionId || !content) {
      return res.status(400).json({ message:  'discussionId, and content are required' });
    }
    
    
    const discussion = await DiscussionForum.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const reply = new Reply({
      userId: req.user._id,
      postId:discussionId,
      content
    });

    const createdReply = await reply.save();
    res.status(201).json(createdReply);
  }),

  // 6. Edit reply by the author of the reply
  editReply: asyncHandler(async (req, res) => {
    const reply = await Reply.findById(req.params.id);

    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (reply.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to edit this reply' });
    }

    reply.reply.content = req.body.content || reply.reply.content;

    const updatedReply = await reply.save();
    res.json(updatedReply);
  }),

  // 7. Delete reply by the author of the reply or the author of the discussion
  deleteReply: asyncHandler(async (req, res) => {
    const reply = await Reply.findById(req.params.id).populate('reply.discussionId');

    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const discussion = reply.reply.discussionId;
    const isReplyAuthor = reply.userId.toString() === req.user._id.toString();
    const isDiscussionAuthor = discussion.userId.toString() === req.user._id.toString();

    if (!isReplyAuthor && !isDiscussionAuthor) {
      return res.status(403).json({ message: 'You are not authorized to delete this reply' });
    }

    await reply.deleteOne();
    res.json({ message: 'Reply removed' });
  }),

  // 8. Generate a feed of discussions based on followed users with pagination (limit 5)
  generateFeed: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 2;  
    const skip = (page - 1) * limit;

    // Fetch the current user to get their followed users
    const user = await User.findById(req.user._id).select('followingUsers');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const followedUsers = user.followingUsers || []; // Array of user IDs the current user follows

    // Fetch discussions where the author is a followed user or the current user
    const discussions = await DiscussionForum.find({
      $or: [
        { userId: { $in: [...followedUsers, req.user._id] } }, // Discussions by followed users or current user
      ],
    })
      .populate('userId', 'username')
      .sort({ createdAt: -1 }) // Sort by creation date (newest first)
      .skip(skip)
      .limit(limit)
      .lean();

    // Fetch discussions with replies by followed users
    const replies = await Reply.find({
      userId: { $in: followedUsers },
    }).select('postId');

    const discussionIdsFromReplies = [...new Set(replies.map(reply => reply.postId.toString()))];

    const additionalDiscussions = await DiscussionForum.find({
      _id: { $in: discussionIdsFromReplies, $nin: discussions.map(d => d._id) },
    })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit - discussions.length)
      .lean();

    // Combine discussions
    let allDiscussions = [...discussions, ...additionalDiscussions];

    // Sort combined discussions by creation date
    allDiscussions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit to 5 items per page
    allDiscussions = allDiscussions.slice(0, limit);

    // Fetch the latest reply for each discussion
    const discussionsWithReplies = await Promise.all(
      allDiscussions.map(async (discussion) => {
        const latestReply = await Reply.findOne({ postId: discussion._id })
          .sort({ createdAt: -1 }) // Get the most recent reply based on createdAt
          .populate('userId', 'username')
          .lean();

        // Structure latestReply to match frontend expectations
        const formattedLatestReply = latestReply
          ? {
              _id: latestReply._id,
              userId: latestReply.userId,
              reply: {
                discussionId: latestReply.postId,
                content: latestReply.content,
                timestamp: latestReply.createdAt,
              },
            }
          : null;

        return {
          ...discussion,
          latestReply: formattedLatestReply,
        };
      })
    );

    // Get total count for pagination
    const totalDiscussions = await DiscussionForum.countDocuments({
      $or: [
        { userId: { $in: [...followedUsers, req.user._id] } },
        { _id: { $in: discussionIdsFromReplies } },
      ],
    });

    res.json({
      discussions: discussionsWithReplies,
      currentPage: page,
      totalPages: Math.ceil(totalDiscussions / limit),
      totalDiscussions,
    });
  }),

  // 9. Get detailed discussion by ID
  getDiscussionById: asyncHandler(async (req, res) => {
    const discussion = await DiscussionForum.findById(req.params.id)
      .populate('userId', 'username');

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Fetch all replies for this discussion
    const replies = await Reply.find({ 'postId': discussion._id })
      .populate('userId', 'username')
      .sort({ 'reply.timestamp': 1 });

    res.json({
      discussion,
      replies,
    });
  }),
};

module.exports = discussionController;