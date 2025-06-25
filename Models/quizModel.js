const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  question: {
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String },
  },
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;