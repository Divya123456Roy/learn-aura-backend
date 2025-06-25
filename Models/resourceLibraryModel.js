const mongoose = require('mongoose');

const resourceLibrarySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String },
  sharedWithUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Track shared users
  sharedWithGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudyGroup' }], // Track shared groups
}, { timestamps: true });

const ResourceLibrary = mongoose.model('ResourceLibrary', resourceLibrarySchema);
module.exports = ResourceLibrary;