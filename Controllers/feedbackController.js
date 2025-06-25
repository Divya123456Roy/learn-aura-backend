// feedbackController.js
const Feedback = require('../Models/feedbackModel');
const asyncHandler = require('express-async-handler');

const feedbackController = {
  // Create a new feedback
  createFeedback: asyncHandler(async (req, res) => {
    const { userId, courseId, rating, comment } = req.body;

    if (!userId || !courseId || !rating || !comment) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const feedback = new Feedback({
      userId,
      courseId,
      rating,
      comment,
    });

    const createdFeedback = await feedback.save();
    res.status(201).json(createdFeedback);
  }),

  // Get all feedbacks
  getAllFeedbacks: asyncHandler(async (req, res) => {
    const feedbacks = await Feedback.find().populate('userId courseId');
    res.json(feedbacks);
  }),

  // Get feedback by ID
  getFeedbackById: asyncHandler(async (req, res) => {
    const feedback = await Feedback.findById(req.params.id).populate('userId courseId');
    if (feedback) {
      res.json(feedback);
    } else {
      res.status(404).json({ message: 'Feedback not found' });
    }
  }),

  // Update feedback (admin or creator)
  updateFeedback: asyncHandler(async (req, res) => {
    const feedback = await Feedback.findById(req.params.id);

    if (feedback) {
      if (req.user.role !== 'admin' && feedback.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to update this feedback' });
      }

      feedback.rating = req.body.rating || feedback.rating;
      feedback.comment = req.body.comment || feedback.comment;

      const updatedFeedback = await feedback.save();
      res.json(updatedFeedback);
    } else {
      res.status(404).json({ message: 'Feedback not found' });
    }
  }),

  // Delete feedback (admin or creator)
  deleteFeedback: asyncHandler(async (req, res) => {
    const feedback = await Feedback.findById(req.params.id);

    if (feedback) {
      if (req.user.role !== 'admin' && feedback.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to delete this feedback' });
      }

      await feedback.remove();
      res.json({ message: 'Feedback removed' });
    } else {
      res.status(404).json({ message: 'Feedback not found' });
    }
  }),

  // Get feedbacks by courseId
  getFeedbacksByCourseId: asyncHandler(async (req, res) => {
    const feedbacks = await Feedback.find({ courseId: req.params.courseId }).populate('userId courseId');
    res.json(feedbacks);
  }),

  // Get feedbacks by userId
  getFeedbacksByUserId: asyncHandler(async (req, res) => {
    const feedbacks = await Feedback.find({ userId: req.params.userId }).populate('userId courseId');
    res.json(feedbacks);
  }),
};

module.exports = feedbackController;