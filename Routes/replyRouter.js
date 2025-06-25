// replyRoutes.js
const express = require('express');
const replyRouter = express.Router();
const replyController = require('../Controllers/replyController');
const { protect } = require('../Middlewares/authMiddleware');

// Public Routes
replyRouter.get('/', replyController.getAllReplies);
replyRouter.get('/:id', replyController.getReplyById);
replyRouter.get('/post/:postId', replyController.getRepliesByPostId);
replyRouter.get('/user/:userId', replyController.getRepliesByUserId);

// Protected Routes
replyRouter.post('/', protect, replyController.createReply);
replyRouter.put('/:id', protect, replyController.updateReply);
replyRouter.delete('/:id', protect, replyController.deleteReply);

module.exports = replyRouter;