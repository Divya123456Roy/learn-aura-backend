const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  content: {
    type: { type: String, enum: ['text', 'image', 'video'], required: true },
    value: { type: String, required: true },
  },
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  order: { type: Number, default: 0 },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Unit = mongoose.model('Unit', unitSchema);
module.exports = Unit;