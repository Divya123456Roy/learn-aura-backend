const express = require('express');
const gamificationRouter = express.Router();
const gamificationController = require('../Controllers/gamificationController');
const { protect, authorize } = require('../Middlewares/authMiddleware');

// Public Routes
gamificationRouter.get('/:userId', protect, gamificationController.getGamificationByUserId); // Protected for user access

// Protected Routes
gamificationRouter.put('/:userId', protect, gamificationController.updateGamification); // User or admin can update
gamificationRouter.get('/', protect, authorize('admin'), gamificationController.getAllGamificationData); // Admin only

module.exports = gamificationRouter;