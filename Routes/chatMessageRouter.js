const express = require('express');
const chatRouter = express.Router();
const chatController = require('../Controllers/chatMessageController');
const { protect } = require('../Middlewares/authMiddleware');

chatRouter.post('/', protect, chatController.createChatMessage);
chatRouter.get('/users/:userId1/:userId2', protect, chatController.getChatMessagesBetweenUsers);
chatRouter.get('/groups/:groupId', protect, chatController.getChatMessagesInGroup);

module.exports = chatRouter;