const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Optional for anonymous feedback
  feedbackText: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: null }, // Optional rating
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;