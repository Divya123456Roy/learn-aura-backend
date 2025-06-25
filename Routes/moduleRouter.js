// moduleRoutes.js
const express = require('express');
const moduleRouter = express.Router();
const moduleController = require('../Controllers/moduleController');
const { protect } = require('../Middlewares/authMiddleware');

// Public Routes
moduleRouter.get('/', moduleController.getAllModules);
moduleRouter.get('/:id', moduleController.getModuleById);
moduleRouter.get('/course/:courseId', moduleController.getModulesByCourseId);

// Protected Routes
moduleRouter.post('/', protect, moduleController.createModule);
moduleRouter.put('/:id', protect, moduleController.updateModule);
moduleRouter.delete('/:id', protect, moduleController.deleteModule);

module.exports = moduleRouter;