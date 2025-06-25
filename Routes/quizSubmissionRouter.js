const express = require('express');
const quizSubmissionRouter = express.Router();
const quizSubmissionController = require('../Controllers/quizSubmissionController');
const { protect, authorize } = require('../Middlewares/authMiddleware');

// Route to submit a quiz (for students)
quizSubmissionRouter.post('/submit', protect, quizSubmissionController.submitQuiz); 

// Route to get a specific quiz submission by ID (for admin/review)
quizSubmissionRouter.get('/:submissionId', protect, quizSubmissionController.getQuizSubmission);
quizSubmissionRouter.post('/check-quiz', protect, authorize("student") , quizSubmissionController.checkQuizSubmission);

// Admin routes to view submissions
quizSubmissionRouter.get('/admin/quiz/:quizId', protect, authorize('admin'), quizSubmissionController.getAllSubmissionsForQuizAdmin);

// Instructor routes to view submissions
quizSubmissionRouter.get('/instructor/all', protect, authorize('instructor'), quizSubmissionController.getAllSubmissionsForInstructor);
quizSubmissionRouter.get('/instructor/quiz/:quizId', protect, authorize('instructor'), quizSubmissionController.getSubmissionsForQuizByInstructor);

module.exports = quizSubmissionRouter;

