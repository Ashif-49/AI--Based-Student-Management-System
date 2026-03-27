const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token or user not found.' });
    }
    const approvalStatus = user.approvalStatus || 'approved';
    if (['student', 'teacher'].includes(user.role) && approvalStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is awaiting admin approval.',
        approvalStatus,
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const requireRoles = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) return next();
  return res.status(403).json({ success: false, message: `Access restricted to: ${roles.join(', ')}.` });
};

const adminOnly = requireRoles('admin');
const staffOnly = requireRoles('admin', 'teacher');

module.exports = { protect, requireRoles, adminOnly, staffOnly };
