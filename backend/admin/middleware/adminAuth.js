const jwt = require('jsonwebtoken');
const AdminUser = require('../model/adminUser');

const authAdmin = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Admin token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin-dashboard-secret');
    const admin = await AdminUser.findById(decoded.adminId).select('-password -loginOtp -loginOtpExpiresAt -resetOtp -resetOtpExpiresAt');

    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired admin session', error: error.message });
  }
};

module.exports = authAdmin;