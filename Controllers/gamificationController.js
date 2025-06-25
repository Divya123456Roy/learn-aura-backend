const Gamification = require('../Models/gamificationModel');
const asyncHandler = require('express-async-handler');
const User = require('../Models/userModel'); // Assuming User model for role checks

const gamificationController = {
  // Update gamification data (admin or user themselves)
  updateGamification: asyncHandler(async (req, res) => {
    const { points, badges, badgeName, level, rank, progress } = req.body;
    const userId = req.params.userId; // Get userId from params

    if (!userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }

    // Check if the user is authorized (admin or the user themselves)
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this gamification data' });
    }

    let gamification = await Gamification.findOne({ userId });

    if (gamification) {
      // Update existing gamification data
      gamification.points = points || gamification.points;
      gamification.badges = badges || gamification.badges;
      gamification.badgeName = badgeName || gamification.badgeName;
      gamification.level = level || gamification.level;
      gamification.rank = rank || gamification.rank;
      gamification.progress = progress || gamification.progress;

      await gamification.save();
      res.json(gamification);
    } else {
      // Create new gamification data
      const newGamification = new Gamification({
        userId,
        points,
        badges,
        badgeName,
        level,
        rank,
        progress,
      });

      await newGamification.save();
      res.status(201).json(newGamification);
    }
  }),

  // Get gamification data for a user
  getGamificationByUserId: asyncHandler(async (req, res) => {
    const gamification = await Gamification.findOne({ userId: req.params.userId }).populate('userId');
    if (gamification) {
      res.json(gamification);
    } else {
      res.status(404).json({ message: 'Gamification data not found' });
    }
  }),

  // Get all gamification data (admin only)
  getAllGamificationData: asyncHandler(async (req, res) => {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access all gamification data' });
    }

    const gamificationData = await Gamification.find().populate('userId');
    res.json(gamificationData);
  }),
};

module.exports = gamificationController;