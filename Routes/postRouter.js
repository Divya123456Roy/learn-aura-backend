const express = require('express');
const postRouter = express.Router();
const postController = require('../Controllers/postController');
const { protect, authorize } = require('../Middlewares/authMiddleware');

// Public Routes
postRouter.get('/', postController.getAllPosts);
postRouter.get('/:id', postController.getPostById);
postRouter.get('/forum/:forumId', postController.getPostsByForumId);
postRouter.get('/user/:userId', postController.getPostsByUserId);

// Protected Routes (Creator and Admin)
postRouter.post('/', protect, postController.createPost);
postRouter.put('/:id', protect, postController.updatePost);
postRouter.delete('/:id', protect, postController.deletePost);

module.exports = postRouter;