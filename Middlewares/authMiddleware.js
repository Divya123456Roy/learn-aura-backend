const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../Models/userModel'); // Adjust the path if needed

const protect = asyncHandler(async (req, res, next) => {

  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    
    try {
    
      token = req.headers.authorization.split(' ')[1];
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
       // Set the user data in req.user
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
});

function authorize(...roles) {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        res.status(403).json({ message: `${req.user.role} is not authorized to access this route` });
      } else {
        next();
      }
    };
}

module.exports = { protect, authorize };