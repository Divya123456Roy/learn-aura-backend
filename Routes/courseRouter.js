// courseRoutes.js
const express = require('express');
const courseRouter = express.Router();
const courseController = require('../Controllers/courseController');
const { protect, admin, authorize } = require('../Middlewares/authMiddleware'); // Assuming you have protect and admin middlewares

courseRouter.get('/all', protect, courseController.getEveryCourses); 
courseRouter.post('/', protect, authorize('instructor'), courseController.createCourse);
courseRouter.get('/', protect, courseController.getAllCourses); 


courseRouter.get('/enrolled', protect, courseController.getEnrolledCourses);
courseRouter.get('/admin-dashboard', protect, courseController.getAdminDashboardData);
courseRouter.get('/admin-summary-counts', protect, courseController.getAdminSummaryCounts);
courseRouter.get('/dashboard-stats', protect, authorize('admin'), courseController.getAdminDashboardStats);
courseRouter.get('/certificate/:courseId', protect, courseController.generateCertificate);  

courseRouter.get('/:id', protect, courseController.getCourseById); 
courseRouter.put('/:id',protect,authorize('instructor','admin'), courseController.updateCourse); 
courseRouter.delete('/:id', protect, courseController.deleteCourse); 
courseRouter.get('/category/:category', protect, courseController.getCoursesByCategory); 
courseRouter.get('/instructor/:instructorId', protect, courseController.getCoursesByInstructorId);


courseRouter.get('/:courseId/content', protect, courseController.getCourseContent);




module.exports = courseRouter;
