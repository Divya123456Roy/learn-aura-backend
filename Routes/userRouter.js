const express = require('express');
const userRouter = express.Router();
const userController = require('../Controllers/userController');
const { protect, authorize } = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/imageUpload');

// Public Routes
userRouter.post('/register', userController.registerUser);
userRouter.post('/login', userController.loginUser);
userRouter.post('/forgot-password', userController.forgotPassword);
userRouter.put('/reset-password/:resetToken', userController.resetPassword);

// Protected Routes
userRouter.get('/profile', protect, userController.getUserProfile);
userRouter.get('/follower', protect, userController.getMyFollower);
userRouter.put(
  '/profile',
  protect,
  upload('users').single('profileImage'), // Restrict to images
  userController.updateUserProfile
);
userRouter.post('/friend-request', protect, userController.sendFriendRequest);
userRouter.put('/friend-request/accept', protect, userController.acceptFriendRequest);
userRouter.put('/friend-request/reject', protect, userController.rejectFriendRequest);
userRouter.post('/follow-user', protect, userController.followUser);
userRouter.post('/unfollow-user', protect, userController.unfollowUser);
userRouter.get('/myrequest', protect, userController.getMyFriendRequests);

userRouter.get('/all-users', protect, authorize('admin'), userController.getAllUsers);
userRouter.get('/all-student', protect, authorize('admin'), userController.getAllStudent);
userRouter.put('/verify-instructor', protect, authorize('admin'), userController.verifyUser);
userRouter.put('/unverify-instructor', protect, authorize('admin'), userController.unVerify);

userRouter.get('/search-users', protect, userController.searchUsers);

module.exports = userRouter;