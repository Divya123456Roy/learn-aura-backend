const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  units: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }],
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  description:{type:String},
  order: { type: Number, default: 0 },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
  quiz:[{type:mongoose.Schema.Types.ObjectId,ref:'Quiz'}]
}, { timestamps: true });

const Module = mongoose.model('Module', moduleSchema);
module.exports = Module;