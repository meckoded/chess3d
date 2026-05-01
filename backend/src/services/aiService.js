const logger = require('../config/logger');

/**
 * Chess AI Service — wraps stockfish.wasm for simple engine analysis.
 *
 * Provides getBestMove(fen, options) that returns the engine's best move
 * for a given position. Uses UCI protocol over the stockfish.wasm API.
 */

let _sf = null;
let _initPromise = null;

const initStockfish = async () => {
  if (_sf) return _sf;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const stockfish = require('stockfish.wasm');
      _sf = await stockfish();
      logger.info('[AI] Stockfish engine initialised');
      return _sf;
    } catch (e) {
      logger.error('[AI] Stockfish init failed:', e.message);
      _initPromise = null;
      throw e;
    }
  })();

  return _initPromise;
};

/**
 * Get best move from the engine.
 *
 * @param {string} fen — FEN string of the current position
 * @param {object} options
 * @param {number} options.depth — search depth (default 12)
 * @param {number} options.moveTime — think time in ms (default 1000)
 * @returns {Promise<string|null>} UCI move string (e.g. "e2e4") or null
 */
const getBestMove = async (fen, { depth = 12, moveTime = 1000 } = {}) => {
  try {
    const sf = await initStockfish();

    return new Promise((resolve) => {
      let bestMove = null;
      const timeout = setTimeout(() => {
        resolve(bestMove);
      }, moveTime + 500);

      const onMessage = (line) => {
        // Parse bestmove from UCI output
        const match = line.match(/^bestmove\s+(\S+)/);
        if (match) {
          bestMove = match[1];
          clearTimeout(timeout);
          sf.removeMessageListener(onMessage);
          resolve(bestMove);
        }
      };

      sf.addMessageListener(onMessage);

      // Send UCI commands
      sf.postMessage('uci');
      sf.postMessage('ucinewgame');
      sf.postMessage('isready');
      sf.postMessage(`position fen ${fen}`);
      sf.postMessage(`go depth ${depth} movetime ${moveTime}`);
    });
  } catch (e) {
    logger.error('[AI] getBestMove error:', e.message);
    return null;
  }
};

/**
 * Simple move evaluation — returns a score for a position.
 * Positive = white advantage, negative = black advantage.
 */
const evaluate = async (fen, { depth = 10 } = {}) => {
  try {
    const sf = await initStockfish();

    return new Promise((resolve) => {
      let score = 0;
      const timeout = setTimeout(() => resolve(score), 2000);

      const onMessage = (line) => {
        const match = line.match(/score\s+(cp|mate)\s+(-?\d+)/);
        if (match) {
          const [, type, val] = match;
          score = type === 'cp' ? parseInt(val) / 100 : (parseInt(val) > 0 ? 100 : -100);
        }
        if (line.startsWith('bestmove')) {
          clearTimeout(timeout);
          sf.removeMessageListener(onMessage);
          resolve(score);
        }
      };

      sf.addMessageListener(onMessage);
      sf.postMessage('uci');
      sf.postMessage('ucinewgame');
      sf.postMessage(`position fen ${fen}`);
      sf.postMessage(`go depth ${depth}`);
    });
  } catch (e) {
    logger.error('[AI] evaluate error:', e.message);
    return 0;
  }
};

module.exports = { initStockfish, getBestMove, evaluate };
