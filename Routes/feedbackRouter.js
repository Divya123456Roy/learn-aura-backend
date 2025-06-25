// feedbackRoutes.js
const express = require('express');
const feedbackRouter = express.Router();
const feedbackController = require('../Controllers/feedbackController');
const { protect, authorize } = require('../Middlewares/authMiddleware');

// Public Routes
feedbackRouter.get('/', feedbackController.getAllFeedbacks);
feedbackRouter.get('/:id', feedbackController.getFeedbackById);
feedbackRouter.get('/course/:courseId', feedbackController.getFeedbacksByCourseId);
feedbackRouter.get('/user/:userId', feedbackController.getFeedbacksByUserId);

// Protected Routes
feedbackRouter.post('/', protect, feedbackController.createFeedback);
feedbackRouter.put('/:id', protect, feedbackController.updateFeedback);
feedbackRouter.delete('/:id', protect, feedbackController.deleteFeedback);

module.exports = feedbackRouter;