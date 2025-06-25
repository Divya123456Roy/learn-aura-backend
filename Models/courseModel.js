const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  enrollmentCount: { type: Number, default: 0 },
  prerequisites: [{ type: String }],
  category: { type: String },
  tags:[{type:String}],
  courseImage: { type: String }, // URL
  price: { type: Number, required: true, default: 0 },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  whatYoullLearn: [{ type: String }], 
  highlights: [{ type: String }],    
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;