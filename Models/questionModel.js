const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, required: true },
  questionText: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String },
  userAnswers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answer: { type: String },
  }],
  deadline: { type: Date }, // Add deadline field
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;