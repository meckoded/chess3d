const express = require('express');
const User = require('../models/User');
const Game = require('../models/Game');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const logger = require('../config/logger');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * Get all users in the system.
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.getAllUsers();
    return res.json({ users });
  } catch (err) {
    logger.error('Admin get users error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user from the system.
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const targetId = req.params.id;

    // Prevent self-deletion
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const deleted = await User.deleteUser(targetId);

    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Admin ${req.user.username} deleted user ${targetId}`);

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    logger.error('Admin delete user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Change a user's role.
 */
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role required: user or admin' });
    }

    const updatedUser = await User.updateRole(req.params.id, role);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Admin ${req.user.username} changed user ${req.params.id} role to ${role}`);

    return res.json({ user: updatedUser });
  } catch (err) {
    logger.error('Admin update role error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/games
 * Get all games in the system.
 */
router.get('/games', async (req, res) => {
  try {
    const games = await Game.getAllGames();
    return res.json({ games });
  } catch (err) {
    logger.error('Admin get games error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/stats
 * Get system-wide statistics.
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Game.getSystemStats();

    const enhancedStats = {
      ...stats,
      total_users: parseInt(stats.total_users, 10),
      total_games: parseInt(stats.total_games, 10),
      active_games: parseInt(stats.active_games, 10),
      completed_games: parseInt(stats.completed_games, 10),
      waiting_games: parseInt(stats.waiting_games, 10),
      total_moves: parseInt(stats.total_moves, 10),
      average_rating: parseInt(stats.average_rating, 10),
      highest_rating: parseInt(stats.highest_rating, 10),
    };

    return res.json({ stats: enhancedStats });
  } catch (err) {
    logger.error('Admin get stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
