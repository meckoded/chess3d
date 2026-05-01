const crypto = require('crypto');
const db = require('../config/database');

const generateId = () => crypto.randomUUID();

const create = async ({ whitePlayer, timeControl = 600 }) => {
  const id = generateId();
  db.run(
    `INSERT INTO games (id, white_player, time_control, status, white_time, black_time)
     VALUES (?, ?, ?, 'waiting', ?, ?)`,
    [id, whitePlayer, timeControl, timeControl, timeControl],
  );
  return findById(id);
};

const findById = async (id) => {
  return db.get(
    `SELECT g.*,
            w.username AS white_username, w.rating AS white_rating,
            b.username AS black_username, b.rating AS black_rating,
            winner.username AS winner_username
     FROM games g
     LEFT JOIN users w ON g.white_player = w.id
     LEFT JOIN users b ON g.black_player = b.id
     LEFT JOIN users winner ON g.winner = winner.id
     WHERE g.id = ?`,
    [id],
  ) || null;
};

const findByStatus = async (statuses) => {
  const placeholders = statuses.map(() => '?').join(',');
  return db.query(
    `SELECT g.*,
            w.username AS white_username, w.rating AS white_rating,
            b.username AS black_username, b.rating AS black_rating
     FROM games g
     LEFT JOIN users w ON g.white_player = w.id
     LEFT JOIN users b ON g.black_player = b.id
     WHERE g.status IN (${placeholders})
     ORDER BY g.created_at DESC
     LIMIT 50`,
    statuses,
  );
};

const findByUser = async (userId) => {
  return db.query(
    `SELECT g.*,
            w.username AS white_username,
            b.username AS black_username,
            winner.username AS winner_username
     FROM games g
     LEFT JOIN users w ON g.white_player = w.id
     LEFT JOIN users b ON g.black_player = b.id
     LEFT JOIN users winner ON g.winner = winner.id
     WHERE g.white_player = ? OR g.black_player = ?
     ORDER BY g.created_at DESC
     LIMIT 30`,
    [userId, userId],
  );
};

const joinGame = async (id, blackPlayer) => {
  db.run(
    `UPDATE games SET black_player = ?, status = 'active', last_move_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    [blackPlayer, id],
  );
  return findById(id);
};

const updateFen = async (id, fen, pgn) => {
  db.run(
    `UPDATE games SET fen = ?, pgn = ?, last_move_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    [fen, pgn, id],
  );
  return findById(id);
};

const updateTime = async (id, whiteTime, blackTime) => {
  db.run(
    'UPDATE games SET white_time = ?, black_time = ?, updated_at = datetime("now") WHERE id = ?',
    [whiteTime, blackTime, id],
  );
};

const setResult = async (id, status, result, winnerId) => {
  db.run(
    'UPDATE games SET status = ?, result = ?, winner = ?, updated_at = datetime("now") WHERE id = ?',
    [status, result, winnerId, id],
  );
  return findById(id);
};

const abortGame = async (id) => {
  db.run("UPDATE games SET status = 'aborted', updated_at = datetime('now') WHERE id = ?", [id]);
  return findById(id);
};

const deleteGame = async (id) => {
  db.run('DELETE FROM games WHERE id = ?', [id]);
};

/**
 * Get all moves for a game, ordered by move_number.
 */
const getMoves = async (gameId) => {
  return db.query(
    'SELECT * FROM moves WHERE game_id = ? ORDER BY move_number ASC',
    [gameId],
  );
};

/**
 * Add a move record.
 */
const addMove = async ({ gameId, moveNumber, playerColor, fromSquare, toSquare, promotion, fenBefore, fenAfter }) => {
  db.run(
    `INSERT INTO moves (game_id, move_number, player_color, from_square, to_square, promotion, fen_before, fen_after, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [gameId, moveNumber, playerColor, fromSquare, toSquare, promotion || null, fenBefore, fenAfter],
  );
};

/**
 * Update game fields by arbitrary key/value pairs.
 */
const updateGame = async (id, data) => {
  const allowed = ['fen', 'pgn', 'status', 'result', 'winner', 'white_time', 'black_time', 'last_move_at', 'ended_at'];
  const sets = [];
  const vals = [];
  for (const [key, value] of Object.entries(data)) {
    if (allowed.includes(key)) {
      sets.push(`${key} = ?`);
      vals.push(value);
    }
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  db.run(`UPDATE games SET ${sets.join(', ')} WHERE id = ?`, vals);
};

const getStats = async () => {
  const users = db.get('SELECT COUNT(*) as total FROM users');
  const activeGames = db.get("SELECT COUNT(*) as total FROM games WHERE status IN ('active','waiting')");
  const completedGames = db.get("SELECT COUNT(*) as total FROM games WHERE status = 'completed'");
  return {
    totalUsers: users ? users.total : 0,
    activeGames: activeGames ? activeGames.total : 0,
    completedGames: completedGames ? completedGames.total : 0,
  };
};

module.exports = {
  create,
  findById,
  findByStatus,
  findByUser,
  joinGame,
  updateFen,
  updateTime,
  setResult,
  abortGame,
  deleteGame,
  getMoves,
  addMove,
  updateGame,
  getStats,
};
