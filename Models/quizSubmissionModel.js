const mongoose = require('mongoose');

const quizSubmissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    questionText: { type: String, required: true }, // Only one question per submission
    selectedAnswer: { type: String },
    correctAnswer:{type:String},
    isCorrect: { type: Boolean },
    score: { type: Number }, // 0 or 1
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
}, { timestamps: true });

const QuizSubmission = mongoose.model('QuizSubmission', quizSubmissionSchema);
module.exports = QuizSubmission;
