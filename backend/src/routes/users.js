const express = require('express');
const User = require('../models/User');
const Game = require('../models/Game');
const authenticate = require('../middleware/auth');
const ratingService = require('../services/rating');
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

    const gameStats = await Game.getUserGameStats(req.user.id);

    const profile = {
      ...user,
      gameStats: {
        totalGames: parseInt(gameStats.total_games, 10),
        wins: parseInt(gameStats.wins, 10),
        losses: parseInt(gameStats.losses, 10),
        draws: parseInt(gameStats.draws, 10),
        activeGames: parseInt(gameStats.active_games, 10),
        winRate: parseFloat(gameStats.win_rate),
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
 * Get the ELO rating leaderboard.
 * Query params: limit (default 50), timeframe (all|week|month)
 */
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const timeframe = req.query.timeframe || null;

    const leaderboard = await User.getLeaderboard(limit, timeframe);

    return res.json({ leaderboard });
  } catch (err) {
    logger.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/stats
 * Get detailed statistics for the current user.
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const gameStats = await Game.getUserGameStats(req.user.id);

    const ratingClass = getRatingClass(user.rating);
    const nextRatingTier = getNextRatingTier(user.rating);
    const pointsToNextTier = nextRatingTier ? nextRatingTier.minRating - user.rating : 0;

    const stats = {
      rating: user.rating,
      ratingClass,
      nextRatingTier,
      pointsToNextTier,
      gamesPlayed: user.games_played,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      totalGames: parseInt(gameStats.total_games, 10),
      activeGames: parseInt(gameStats.active_games, 10),
      winRate: parseFloat(gameStats.win_rate),
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
 * GET /api/users/search
 * Search for players by username.
 * Query params: q (search term), limit (default 10)
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const players = await User.searchPlayers(q.trim(), limit);

    return res.json({ players });
  } catch (err) {
    logger.error('Search players error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/:id
 * Get a user's public profile by ID.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const gameStats = await Game.getUserGameStats(req.params.id);

    const publicProfile = {
      id: user.id,
      username: user.username,
      rating: user.rating,
      gamesPlayed: user.games_played,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      gameStats: {
        totalGames: parseInt(gameStats.total_games, 10),
        wins: parseInt(gameStats.wins, 10),
        losses: parseInt(gameStats.losses, 10),
        draws: parseInt(gameStats.draws, 10),
        winRate: parseFloat(gameStats.win_rate),
      },
      createdAt: user.created_at,
      lastActive: user.updated_at,
    };

    return res.json({ profile: publicProfile });
  } catch (err) {
    logger.error('Get user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Helper functions ---

const ratingClasses = [
  { name: 'Beginner', minRating: 0, maxRating: 999 },
  { name: 'Intermediate', minRating: 1000, maxRating: 1399 },
  { name: 'Advanced', minRating: 1400, maxRating: 1699 },
  { name: 'Expert', minRating: 1700, maxRating: 1999 },
  { name: 'Master', minRating: 2000, maxRating: 2199 },
  { name: 'Grandmaster', minRating: 2200, maxRating: 2499 },
  { name: 'Legend', minRating: 2500, maxRating: Infinity },
];

const getRatingClass = (rating) => {
  return ratingClasses.find((c) => rating >= c.minRating && rating <= c.maxRating)?.name || 'Beginner';
};

const getNextRatingTier = (rating) => {
  for (const ratingClass of ratingClasses) {
    if (rating < ratingClass.minRating) {
      return ratingClass;
    }
  }
  return null; // Already Legend tier
};

module.exports = router;
