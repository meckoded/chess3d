const logger = require('../config/logger');

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    logger.warn(`Non-admin user ${req.user.id} attempted admin access`);
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

module.exports = requireAdmin;
