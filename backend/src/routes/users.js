const express = require('express');
const User = require('../models/User');
const Game = require('../models/Game');
const authenticate = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /api/users/profile
 * Get the current user's full profile.
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const games = await Game.findByUser(req.user.id);
    const wins = games.filter(g => g.winner === req.user.id).length;
    const losses = games.filter(g => g.status === 'completed' && g.winner && g.winner !== req.user.id && (g.white_player === req.user.id || g.black_player === req.user.id)).length;
    const draws = games.filter(g => g.result === 'draw' && (g.white_player === req.user.id || g.black_player === req.user.id)).length;
    const totalCompleted = wins + losses + draws;

    const profile = {
      ...user,
      gameStats: {
        totalGames: games.length,
        wins,
        losses,
        draws,
        activeGames: games.filter(g => g.status === 'active').length,
        winRate: totalCompleted > 0 ? ((wins / totalCompleted) * 100).toFixed(1) : '0.0',
      },
    };
    return res.json({ profile });
  } catch (err) {
    logger.error('Get profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const leaderboard = await User.getLeaderboard(limit);
    return res.json({ leaderboard });
  } catch (err) {
    logger.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const games = await Game.findByUser(req.user.id);
    const wins = games.filter(g => g.winner === req.user.id).length;
    const losses = games.filter(g => g.status === 'completed' && g.winner && g.winner !== req.user.id).length;
    const draws = games.filter(g => g.result === 'draw').length;
    const totalCompleted = wins + losses + draws;

    const stats = {
      rating: user.rating,
      ratingClass: getRatingClass(user.rating),
      gamesPlayed: user.games_played,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      totalGames: games.length,
      activeGames: games.filter(g => g.status === 'active' || g.status === 'waiting').length,
      winRate: totalCompleted > 0 ? ((wins / totalCompleted) * 100).toFixed(1) : '0.0',
      joinedAt: user.created_at,
      lastActive: user.updated_at,
    };
    return res.json({ stats });
  } catch (err) {
    logger.error('Get stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/users/profile
 * Update current user's profile.
 */
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    // Update username via the model
    const db = require('../config/database');
    const existing = db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    db.run("UPDATE users SET username = ?, updated_at = datetime('now') WHERE id = ?", [username, req.user.id]);
    const user = await User.findById(req.user.id);
    return res.json({ user });
  } catch (err) {
    logger.error('Update profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password_hash, refresh_token, refresh_token_expires_at, email, ...publicUser } = user;
    return res.json({ profile: publicUser });
  } catch (err) {
    logger.error('Get user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const ratingClasses = [
  { name: 'Beginner', minRating: 0, maxRating: 999 },
  { name: 'Intermediate', minRating: 1000, maxRating: 1399 },
  { name: 'Advanced', minRating: 1400, maxRating: 1699 },
  { name: 'Expert', minRating: 1700, maxRating: 1999 },
  { name: 'Master', minRating: 2000, maxRating: 2199 },
  { name: 'Grandmaster', minRating: 2200, maxRating: 2499 },
  { name: 'Legend', minRating: 2500, maxRating: Infinity },
];

const getRatingClass = (rating) => ratingClasses.find(c => rating >= c.minRating && rating <= c.maxRating)?.name || 'Beginner';

module.exports = router;
