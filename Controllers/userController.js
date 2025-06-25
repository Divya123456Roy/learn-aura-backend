const User = require('../Models/userModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const validator = require('validator');
const Notification = require('../Models/notificationModel');
const Feed = require('../Models/feedModel');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const Post = require('../Models/postModel');

const userController = {
  // Register a new user
  registerUser: asyncHandler(async (req, res) => {
    const { username, email, password, role,gender } = req.body;

    // Input Validation
    if (!username || !email || !password || !role || !gender) {
      res.status(400).json({ message: 'Please provide all required fields' });
      return;
    }

    if (!validator.isEmail(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      const userExists = await User.findOne({ email });
      if (userExists) {
        res.status(409).json({ message: 'User with this email already exists' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
        gender,
      });

      if (user) {
        res.status(201).json({
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          gender:user.gender,
          token: generateToken(user._id, user.role, user.username, user.email,user.gender),
        });
      } else {
        res.status(500).json({ message: 'Failed to create user' });
      }
    } catch (error) {
      console.error('User Registration Error:', error);
      res.status(500).json({ message: 'Internal server error during registration' });
    }
  }),

  // Login user
  loginUser: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    if (!validator.isEmail(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    try {
      const user = await User.findOne({ email });
      if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          gender:user.gender,
          token: generateToken(user._id, user.role,user.username,user.email,user.gender),
        });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } catch (error) {
      console.error('User Login Error:', error);
      res.status(500).json({ message: 'Internal server error during login' });
    }
  }),

  // Get user profile
  getUserProfile: asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('Get User Profile Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }),

  // Update user profile
  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/user/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the link to reset the password: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message,
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({ message: 'Email sending failed' });
    }
  }),

  // Reset Password
  resetPassword: asyncHandler(async (req, res) => {
 
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
  
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid token or token expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  }),

  // Update user profile with image upload
  updateUserProfile : asyncHandler(async (req, res) => {
    const { username, email, profile } = req.body;
  
    // Validate email if provided
    if (email && !validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
  
    try {
      const user = await User.findById(req.user._id);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Check for email uniqueness
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(409).json({ message: "Email is already taken by another user" });
        }
      }
  
      // Parse profile data if provided
      let profileData = user.profile || {};
      if (profile) {
        try {
          profileData = typeof profile === "string" ? JSON.parse(profile) : profile;
        } catch (error) {
          return res.status(400).json({ message: "Invalid profile data format" });
        }
      }
  
      // Update user fields
      user.username = username || user.username;
      user.email = email || user.email;
      user.profile = {
        ...user.profile,
        bio: profileData.bio || user.profile.bio || "",
      };
  
      // Handle profile picture upload (Cloudinary URL)
      if (req.file) {
        user.profile.profilePicture = req.file.path; // Cloudinary URL
      }
  
      // Save the updated user
      const updatedUser = await user.save();
  
      // Return the updated user
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        gender: updatedUser.gender,
        profile: updatedUser.profile,
        token: generateToken(updatedUser._id, updatedUser.role, updatedUser.username, updatedUser.email),
      });
    } catch (error) {
      console.error("Update User Profile Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }),
  // Send friend request
  sendFriendRequest: asyncHandler(async (req, res) => {
    const { friendId } = req.body;
    console.log(req.body);
    
    try {
      const user = await User.findById(req.user._id);
      const friend = await User.findById(friendId);

      if (!user || !friend) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.friends.includes(friendId)) {
        return res.status(400).json({ message: 'User is already a friend' });
      }

      if (user.friendRequests.includes(friendId)) {
        return res.status(400).json({message: "Friend request already sent."});
      }

      if (friend.friendRequests.includes(req.user._id)) {
        return res.status(400).json({message: "You already have a friend request from this user."});
      }

      friend.friendRequests.push(req.user._id);
      await friend.save();

      const notification = new Notification({
        userId: friendId,
        type: 'friendRequest',
        message: `${user.username} sent you a friend request.`,
        relatedId: req.user._id,
        relatedModel: 'User',
      });
      await notification.save();

      res.json({ message: 'Friend request sent successfully' });
    } catch (error) {
      console.error('Send Friend Request Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }),

  // Accept friend request
  acceptFriendRequest: asyncHandler(async (req, res) => {
    const { friendId } = req.body;
    try {
      const user = await User.findById(req.user._id);
      const friend = await User.findById(friendId);

      if (!user || !friend) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.friendRequests.includes(friendId)) {
        return res.status(400).json({ message: 'Friend request not found' });
      }

      user.friendRequests = user.friendRequests.filter((id) => id.toString() !== friendId.toString());
      user.friends.push(friendId);
      friend.friends.push(req.user._id);

      await user.save();
      await friend.save();

      const notification = new Notification({
        userId: friendId,
        type: 'friendRequestAccepted',
        message: `${user.username} accepted your friend request.`,
        relatedId: req.user._id,
        relatedModel: 'User',
      });
      await notification.save();

      res.json({ message: 'Friend request accepted successfully' });
    } catch (error) {
      console.error('Accept Friend Request Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }),

  // Reject friend request
  rejectFriendRequest: asyncHandler(async (req, res) => {
    const { friendId } = req.body;
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.friendRequests.includes(friendId)) {
        return res.status(400).json({ message: 'Friend request not found' });
      }

      user.friendRequests = user.friendRequests.filter((id) => id.toString() !== friendId.toString());
      await user.save();

      res.json({ message: 'Friend request rejected successfully' });
    } catch (error) {
      console.error('Reject Friend Request Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }),
  // follow user
  followUser: asyncHandler(async(req,res)=>{
    const {userId} = req.body;
    if(!userId){
      return res.status(400).json({message:'User ID is required'});
    }
    try{
      const user = await User.findById(req.user._id);
      const followUser = await User.findById(userId);
      
      if(!user || !followUser){
        return res.status(404).json({message: "User not found"});
      }
      if(user.followingUsers.includes(userId)){
        return res.status(400).json({message: "User is already following"});
      }
      user.followingUsers.push(userId);
      await user.save();

      const notification = new Notification({
        userId: userId,
        type: 'newFollower', // Or a more specific notification type
        message: `${user.username} started following you.`,
        relatedId: req.user._id,
        relatedModel: 'User',
      });
      await notification.save();
      
      res.json({message: "User followed successfully"});
    }catch(error){
      console.error('Follow User Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }),
  // unfollow user
  unfollowUser: asyncHandler(async(req,res)=>{
    const {userId} = req.body;
    try{
      const user = await User.findById(req.user._id);
      if(!user){
        return res.status(404).json({message: "User not found"});
      }
      if(!user.followingUsers.includes(userId)){
        return res.status(400).json({message: "User is not following"});
      }
      user.followingUsers = user.followingUsers.filter(id=>id.toString() !== userId);
      await user.save();
      res.json({message: "User unfollowed successfully"});
    }catch(error){
      console.error('Unfollow User Error:', error);
      res.status(500).json({ message: 'Internal server error'})
  }
  }),
  getMyFriendRequests: asyncHandler(async(req,res)=>{
    try {
      const friendRequests = await User.findById(req.user.id).populate({
        path:"friendRequests",
        select:"-password"
      })
      if(!friendRequests){
        res.status(404).send("not Found friend requests")
      }
      res.status(200).send(friendRequests)
    }catch(error){
      console.error('Get My Friend Request Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }),
  // get user feed
  getUserFeed: asyncHandler(async(req,res)=>{
    try{
      const user = await User.findById(req.user._id);
      if(!user){
        return res.status(404).json({message: "User not found"});
      }
      const feed = await Feed.findOne({userId: req.user._id}).populate({
        path: 'feedItems.itemId',
        populate: {
          path: 'userId senderId'
        }
      });
      if(!feed){
        return res.status(404).json({message: "Feed not found"});
      }
      res.json(feed.feedItems);
    }catch(error){
      console.error('Get User Feed Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }),

  getMyFollower:asyncHandler(async(req,res)=>{
    try {
      const followers = await User.findById(req.user.id).populate({
        path:"followingUsers",
        select:"-password"
      }).populate('friends')
     
      
      if(!followers){
        res.status(404).send("Followers not found")
      }
      res.status(200).send(followers)
      
    } catch (error) {
      console.log("Get my Followers Error:",error);
      res.status(500).send("Internal Server error")
    }
  }),
  
  getAllUsers:asyncHandler(async(req,res)=>{

    const allUsers = await User.find({role:'instructor'})
    if(!allUsers){
      res.status(404).send("Failed to fetch users data")
    }
    res.send(allUsers)
  }

),

getAllStudent:asyncHandler(async(req,res)=>{
  

  const allUsers = await User.find({role:'student'})
  if(!allUsers){
    res.status(404).send("Failed to fetch users data")
  }
  res.send(allUsers)
}

),

searchUsers :asyncHandler(async (req, res) => {
  const { search } = req.query;

  try {
    // Build the query to fetch all users (students and instructors)
    const query = {};
    if (search) {
      query.username = { $regex: search, $options: "i" }; // Case-insensitive search by username
    }

    // Fetch users matching the query, including only the required fields
    const users = await User.find({
      ...query,
      _id: { $ne: req.user.id }, // Exclude the current user
      role:{$ne:"admin"},
    })
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Add isFollowing field based on the current user's followingUsers array
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const usersWithFollowingStatus = users.map(user => ({
      ...user.toObject(),
      isFollowing: currentUser.followingUsers.includes(user._id),
    }));

    res.json(usersWithFollowingStatus);
  } catch (error) {
    console.error("Search Users Error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}),
verifyUser:asyncHandler(async(req,res)=>{
  try {
    const {userId}=req.body
  const user=await User.findById(userId)
  if(!user){
    return res.status(404).json({ message: "User not found" });
    }
  if(user.role !== "instructor"){
    return res.status(403).json({ message: "Only instructors can be verified" });
  }
  user.isVerified = true
  const updatedUser = await user.save()
  if(!updatedUser){
    return res.status(500).json({ message: "Failed to update user" });
  }
  res.json({ message: "User verified successfully" });
  } catch (error) {
    console.error("Search Users Error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}),
unVerify:asyncHandler(async(req,res)=>{
  try {
    const {userId}=req.body
    const user=await User.findById(userId)
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    if(user.role !== "instructor"){
      return res.status(403).json({ message: "Only instructors can be unverified" });
    }
    user.isVerified = false
    const updatedUser = await user.save()
    if(!updatedUser){
      return res.status(500).json({ message: "Failed to update user" });
    }
    res.json({ message: "User unverified successfully" });
    } catch (error) { 
      console.error("Search Users Error:", error.message);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }

})

}
module.exports = userController;