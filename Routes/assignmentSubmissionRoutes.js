const express = require('express');
const assignmentSubmissionRouter = express.Router();
const assignmentSubmissionController = require('../Controllers/assignmentSubmissionController');
const { authorize, protect } = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/imageUpload');


// Student routes
assignmentSubmissionRouter.post('/submit', protect, authorize("student"), upload("assignments").single("assignmentFile"), assignmentSubmissionController.submitAssignment);
assignmentSubmissionRouter.get('/me', protect, authorize("student"), assignmentSubmissionController.getStudentSubmissions);
assignmentSubmissionRouter.post('/check-assignment', protect, authorize("student"), assignmentSubmissionController.checkAssignmentSubmission);

// Teacher routes
assignmentSubmissionRouter.get('/assignment/:assignmentId', protect, authorize("instructor"), assignmentSubmissionController.getAssignmentSubmissionsForTeacher);
assignmentSubmissionRouter.put('/grade/:submissionId', protect, authorize("instructor"), assignmentSubmissionController.gradeAssignmentSubmission);

// Admin routes
assignmentSubmissionRouter.get('/admin/assignment/:assignmentId', protect, authorize("admin"), assignmentSubmissionController.getAllSubmissionsForAdmin);
assignmentSubmissionRouter.get('/admin/student/:studentId', protect, authorize("admin"), assignmentSubmissionController.getAllSubmissionsByStudentForAdmin);

module.exports = assignmentSubmissionRouter;