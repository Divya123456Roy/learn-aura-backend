const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'instructor', 'student'], required: true },
  gender: { type: String, required: true },
  isVerified:{ type: Boolean, default: false },
  profile: {
    firstName: { type: String },
    lastName: { type: String },
    contactNumber: { type: String },
    bio: { type: String },
    qualifications: { type: String },
    profilePicture: { type: String }, // URL
    learningInterests: [{ type: String }],
    academicBackground: { type: String },
    professionalGoals: { type: String },
    skillsets: [{ type: String }],
    learningPreferences: [{ type: String }],
  },
  paymentInformation: {
    subscriptionType: { type: String },
    paymentMethod: { type: String },
    lastPaymentDate: { type: Date },
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followingGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudyGroup' }],
  enrolledCourses:[{type: mongoose.Schema.Types.ObjectId, ref: 'Course'}],
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }, 
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;