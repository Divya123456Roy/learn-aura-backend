const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String },  
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Added invitedUsers array
  groupImage: { type: String }, // optional Group image URL
  tags: [{ type: String }], // Optional tags for the group
}, { timestamps: true });

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);
module.exports = StudyGroup;