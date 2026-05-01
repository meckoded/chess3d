const express = require('express');
const User = require('../models/User');
const Game = require('../models/Game');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const logger = require('../config/logger');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const users = await User.getAllUsers();
    return res.json({ users });
  } catch (err) {
    logger.error('Admin get users error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await User.deleteUser(req.params.id);
    logger.info(`Admin ${req.user.username} deleted user ${req.params.id}`);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    logger.error('Admin delete user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role required: user or admin' });
    }
    await User.setRole(req.params.id, role);
    logger.info(`Admin ${req.user.username} changed user ${req.params.id} role to ${role}`);
    return res.json({ success: true, role });
  } catch (err) {
    logger.error('Admin update role error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/games', async (req, res) => {
  try {
    const games = await Game.findByStatus(['active', 'waiting', 'completed', 'draw', 'resigned']);
    return res.json({ games });
  } catch (err) {
    logger.error('Admin get games error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await Game.getStats();
    return res.json({ stats });
  } catch (err) {
    logger.error('Admin get stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
