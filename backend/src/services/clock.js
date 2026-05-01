const logger = require('../config/logger');

/**
 * Chess clock service — server-side time enforcement.
 *
 * Each game tracks white_time and black_time (seconds remaining).
 * On every move, the server computes elapsed time since last_move_at,
 * deducts it from the moving player's clock, and checks for timeout.
 */

/**
 * Calculate elapsed time since the game's last_move_at.
 * Returns elapsed seconds. Caps at the player's remaining time.
 */
const computeElapsed = (game, playerColor) => {
  const now = Date.now();
  const lastMove = game.last_move_at ? new Date(game.last_move_at).getTime() : new Date(game.created_at).getTime();
  const elapsed = Math.floor((now - lastMove) / 1000);
  return Math.max(0, elapsed);
};

/**
 * Deduct time and return new clock state. Optionally adds increment.
 * Returns { whiteTime, blackTime, elapsed, isTimeout }.
 */
const processMove = (game, playerColor, incrementSecs = 0) => {
  const elapsed = computeElapsed(game, playerColor);

  let whiteTime = game.white_time;
  let blackTime = game.black_time;

  if (playerColor === 'w') {
    whiteTime = Math.max(0, whiteTime - elapsed);
    if (incrementSecs > 0) whiteTime += incrementSecs;
  } else {
    blackTime = Math.max(0, blackTime - elapsed);
    if (incrementSecs > 0) blackTime += incrementSecs;
  }

  const isWhiteTimeout = playerColor === 'w' && whiteTime <= 0;
  const isBlackTimeout = playerColor === 'b' && blackTime <= 0;
  const isTimeout = isWhiteTimeout || isBlackTimeout;

  if (isTimeout) {
    logger.info(`Time expired: ${playerColor === 'w' ? 'White' : 'Black'} in game (${whiteTime}/${blackTime})`);
  }

  return { whiteTime, blackTime, elapsed, isTimeout };
};

/**
 * Get remaining time for the player whose turn it is.
 */
const getRemainingTime = (game, playerColor) => {
  return playerColor === 'w' ? game.white_time : game.black_time;
};

/**
 * Format seconds as mm:ss
 */
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

module.exports = { computeElapsed, processMove, getRemainingTime, formatTime };
