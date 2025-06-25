const mongoose = require('mongoose');

const gamificationSchema = new mongoose.Schema({
  badgeName: { type: String, required: true },
  description: { type: String },
  criteria: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number },
  leaderboardPosition: { type: Number },
  givenBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
}, { timestamps: true });

const Gamification = mongoose.model('Gamification', gamificationSchema);
module.exports = Gamification