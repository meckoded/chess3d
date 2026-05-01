/**
 * ELO Rating System for Chess3D.
 *
 * Standard ELO formula:
 *   expected = 1 / (1 + 10^((opponent_rating - player_rating) / 400))
 *   new_rating = old_rating + K * (score - expected)
 *
 * K-factor:
 *   - 32 for standard games (default)
 *   - 24 for players rated above 2100
 *   - 16 for players rated above 2400
 */

const DEFAULT_K = 32;
const K_HIGH = 24;
const K_VERY_HIGH = 16;
const RATING_DIVISOR = 400;

/**
 * Calculate new ratings for both players after a game.
 * @param {number} whiteRating - White player's current rating
 * @param {number} blackRating - Black player's current rating
 * @param {'white'|'black'|'draw'} result - Game result
 * @returns {{ whiteNewRating: number, blackNewRating: number, whiteChange: number, blackChange: number }}
 */
const calculateNewRatings = (whiteRating, blackRating, result) => {
  const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / RATING_DIVISOR));
  const expectedBlack = 1 - expectedWhite;

  let scoreWhite, scoreBlack;

  switch (result) {
    case 'white':
      scoreWhite = 1;
      scoreBlack = 0;
      break;
    case 'black':
      scoreWhite = 0;
      scoreBlack = 1;
      break;
    case 'draw':
      scoreWhite = 0.5;
      scoreBlack = 0.5;
      break;
    default:
      throw new Error(`Invalid result: ${result}. Must be 'white', 'black', or 'draw'`);
  }

  const kWhite = getKFactor(whiteRating);
  const kBlack = getKFactor(blackRating);

  const whiteChange = Math.round(kWhite * (scoreWhite - expectedWhite));
  const blackChange = Math.round(kBlack * (scoreBlack - expectedBlack));

  return {
    whiteNewRating: whiteRating + whiteChange,
    blackNewRating: blackRating + blackChange,
    whiteChange,
    blackChange,
  };
};

/**
 * Get the K-factor based on player rating.
 * @param {number} rating
 * @returns {number} K-factor
 */
const getKFactor = (rating) => {
  if (rating >= 2400) return K_VERY_HIGH;
  if (rating >= 2100) return K_HIGH;
  return DEFAULT_K;
};

/**
 * Calculate the expected score for a player against an opponent.
 * @param {number} playerRating
 * @param {number} opponentRating
 * @returns {number} Expected score (0 to 1)
 */
const getExpectedScore = (playerRating, opponentRating) => {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / RATING_DIVISOR));
};

/**
 * Calculate performance rating based on results against opponents.
 * @param {Array<{opponentRating: number, score: number}>} results - Array of opponent ratings and scores
 * @returns {number} Performance rating
 */
const calculatePerformanceRating = (results) => {
  if (results.length === 0) return 1200;

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const avgOpponentRating =
    results.reduce((sum, r) => sum + r.opponentRating, 0) / results.length;

  const winRate = totalScore / results.length;

  // Avoid extreme values
  if (winRate >= 1.0) return avgOpponentRating + 400;
  if (winRate <= 0.0) return avgOpponentRating - 400;

  const ratingDiff = -400 * Math.log10(1 / winRate - 1);
  return Math.round(avgOpponentRating + ratingDiff);
};

module.exports = {
  calculateNewRatings,
  getKFactor,
  getExpectedScore,
  calculatePerformanceRating,
  DEFAULT_K,
};
