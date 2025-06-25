
const express = require('express');
const submissionRouter = express.Router();
const submissionController = require('../Controllers/submissionController');
const { protect } = require('../Middlewares/authMiddleware');

submissionRouter.post('/submit/:questionId', protect, submissionController.submitAnswer);
submissionRouter.get('/module/:moduleId', protect, submissionController.getModuleSubmissions);
submissionRouter.get('/user/module/:moduleId', protect, submissionController.getUserSubmissionsForModule);
submissionRouter.get('/scores/course/:courseId/student', protect, submissionController.getStudentScoresByCourse);
submissionRouter.get('/module/:moduleId/teacher', protect, submissionController.getTeacherSubmissionsByModule);
submissionRouter.get('/scores/course/:courseId', protect, submissionController.getAllScoresByCourse);
submissionRouter.get('/module/:moduleId/all', protect, submissionController.getAllSubmissionsByModule);
submissionRouter.get('/:submissionId', protect, submissionController.getSubmissionById);
module.exports = submissionRouter;