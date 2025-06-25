const jwt = require('jsonwebtoken');

const generateToken = (id,role,name,email) => {
  return jwt.sign({ id,role,name,email }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

module.exports = generateToken;