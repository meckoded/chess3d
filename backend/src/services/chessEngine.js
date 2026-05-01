const { Chess } = require('chess.js');

/**
 * Create a new chess game instance from FEN or default start position.
 */
const createGame = (fen = null) => {
  if (fen) {
    return new Chess(fen);
  }
  return new Chess();
};

/**
 * Perform a move on a chess game.
 * Returns { success, game, move, fen, pgn } or { success: false, error }
 */
const makeMove = (game, { from, to, promotion }) => {
  try {
    const fenBefore = game.fen();
    const result = game.move({ from, to, promotion: promotion || undefined });

    if (!result) {
      return { success: false, error: 'Invalid move' };
    }

    return {
      success: true,
      game,
      move: result,
      fenBefore,
      fenAfter: game.fen(),
      pgn: game.pgn(),
    };
  } catch (err) {
    return { success: false, error: err.message || 'Invalid move' };
  }
};

/**
 * Get the current state of the game.
 */
const getGameState = (game) => {
  return {
    fen: game.fen(),
    pgn: game.pgn(),
    turn: game.turn(),
    isGameOver: game.isGameOver(),
    isCheckmate: game.isCheckmate(),
    isDraw: game.isDraw(),
    isStalemate: game.isStalemate(),
    isCheck: game.isCheck(),
    isThreefoldRepetition: game.isThreefoldRepetition(),
    isInsufficientMaterial: game.isInsufficientMaterial(),
    moveNumber: game.moveNumber(),
    history: game.history({ verbose: true }),
  };
};

/**
 * Get available moves for a given square.
 */
const getMoves = (game, square) => {
  return game.moves({ square, verbose: true });
};

/**
 * Load a game from PGN.
 */
const loadPgn = (pgn) => {
  const game = new Chess();
  game.loadPgn(pgn);
  return game;
};

/**
 * Validate that it's the correct player's turn.
 */
const isCorrectTurn = (game, color) => {
  return game.turn() === color;
};

const getCurrentTurn = (game) => {
  return game.turn();
};

module.exports = {
  createGame,
  makeMove,
  getGameState,
  getMoves,
  loadPgn,
  isCorrectTurn,
  getCurrentTurn,
};
