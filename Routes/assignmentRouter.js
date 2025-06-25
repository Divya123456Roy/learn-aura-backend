// assignmentRoutes.js
const express = require('express');
const assignmentRouter = express.Router();
const assignmentController = require('../Controllers/assignmentController');
const { protect, authorize } = require('../Middlewares/authMiddleware'); // Assuming you have protect middleware

assignmentRouter.post('/', protect, authorize("instructor"), assignmentController.createAssignment);
assignmentRouter.get('/', assignmentController.getAllAssignments);
assignmentRouter.get('/:id', assignmentController.getAssignmentById);

assignmentRouter.put('/:id', protect, authorize("instructor"), assignmentController.updateAssignment);
assignmentRouter.delete('/:id', protect, authorize("instructor"), assignmentController.deleteAssignment);
assignmentRouter.get('/course/:courseId', assignmentController.getAssignmentsByCourse);
assignmentRouter.get('/module/:moduleId', assignmentController.getAssignmentsByModule);

module.exports = assignmentRouter;