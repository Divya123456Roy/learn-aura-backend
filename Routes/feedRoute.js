const express = require('express');
const feedRouter = express.Router();
const feedController = require('../Controllers/feedController');
const { protect } = require('../Middlewares/authMiddleware');

// Protected Routes (Logged-in Users)
feedRouter.get('/', protect, feedController.getUserFeed);

module.exports = feedRouter;