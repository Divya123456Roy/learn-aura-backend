// feedController.js
const asyncHandler = require('express-async-handler');
const Feed = require('../Models/feedModel');
const Post = require('../Models/postModel');
const Reply = require('../Models/replyModel');

const feedController = {
  getUserFeed: asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
      const feed = await Feed.findOne({ userId: userId }).populate({
        path: 'feedItems.itemId',
        populate: {
          path: 'userId forumId postId', // Populate user, forum, and post for posts and replies
        },
      });
      console.log(feed);
      

      if (!feed) {
        return res.json({ feedItems: [] }); // Return empty feed if not found
      }

      // Format feed items for easier frontend consumption
      const formattedFeedItems = await Promise.all(
        feed.feedItems.map(async (item) => {
          if (item.type === 'post') {
            const post = await Post.findById(item.itemId._id).populate(
              'userId forumId'
            );
            return {
              type: 'post',
              item: post,
            };
          } else if (item.type === 'reply') {
            const reply = await Reply.findById(item.itemId._id).populate(
              'userId postId'
            );
            if (reply && reply.postId) {
              const post = await Post.findById(reply.postId).populate(
                'userId forumId'
              );
              return {
                type: 'reply',
                item: reply,
                post: post, // include the relevant post.
              };
            } else {
              // Handle the case where reply or reply.postId is null
              return null; // Or handle this case in a way that suits your application.
            }
          }
          return null;
        })
      );

      res.json({ feedItems: formattedFeedItems.filter((item) => item !== null) });
    } catch (error) {
      console.error('Error getting user feed:', error);
      res
        .status(500)
        .json({ message: 'Internal server error', error: error.message });
    }
  }),
};

module.exports = feedController;