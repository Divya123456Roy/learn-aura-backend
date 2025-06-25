const express = require('express');
const discussionForumRouter = express.Router();
const discussionForumController = require('../Controllers/discussionForumController');
const { protect, authorize } = require('../Middlewares/authMiddleware');


discussionForumRouter.get('/', protect, discussionForumController.generateFeed);
discussionForumRouter.get('/:id', protect,discussionForumController.getDiscussionById);

// Protected Routes (Creator and Admin)
discussionForumRouter.post('/', protect, discussionForumController.createDiscussion);
discussionForumRouter.put('/:id', protect, discussionForumController.editDiscussion);
discussionForumRouter.delete('/:id', protect, authorize('student'), discussionForumController.deleteDiscussion);

discussionForumRouter.post('/reply', protect, discussionForumController.createReply);
discussionForumRouter.put('/reply/:id', protect, discussionForumController.editReply);
discussionForumRouter.put('/reply/:id', protect, discussionForumController.deleteReply);

module.exports = discussionForumRouter;