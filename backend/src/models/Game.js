const db = require('../config/database');

const create = async ({ whitePlayer, timeControl = 600 }) => {
  const result = await db.query(
    `INSERT INTO games (white_player, time_control, status)
     VALUES ($1, $2, 'waiting')
     RETURNING *`,
    [whitePlayer, timeControl],
  );
  return result.rows[0];
};

const findById = async (id) => {
  const result = await db.query(
    `SELECT g.*,
            w.username AS white_username, w.rating AS white_rating,
            b.username AS black_username, b.rating AS black_rating,
            winner.username AS winner_username
     FROM games g
     LEFT JOIN users w ON g.white_player = w.id
     LEFT JOIN users b ON g.black_player = b.id
     LEFT JOIN users winner ON g.winner = winner.id
     WHERE g.id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

const getActiveGames = async (filters = {}) => {
  let query = `
    SELECT g.*,
           w.username AS white_username, w.rating AS white_rating,
           b.username AS black_username, b.rating AS black_rating
    FROM games g
    LEFT JOIN users w ON g.white_player = w.id
    LEFT JOIN users b ON g.black_player = b.id
    WHERE 1=1
  `;

  const params = [];
  let paramIdx = 1;

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query += ` AND g.status = ANY($${paramIdx})`;
      params.push(filters.status);
    } else {
      query += ` AND g.status = $${paramIdx}`;
      params.push(filters.status);
    }
    paramIdx++;
  }

  if (filters.playerId) {
    query += ` AND (g.white_player = $${paramIdx} OR g.black_player = $${paramIdx})`;
    params.push(filters.playerId);
    paramIdx++;
  }

  query += ' ORDER BY g.created_at DESC';

  if (filters.limit) {
    query += ` LIMIT $${paramIdx}`;
    params.push(filters.limit);
  }

  const result = await db.query(query, params);
  return result.rows;
};

const joinGame = async (gameId, blackPlayer) => {
  const result = await db.query(
    `UPDATE games
     SET black_player = $2, status = 'active', fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
     WHERE id = $1 AND status = 'waiting' AND white_player != $2
     RETURNING *`,
    [gameId, blackPlayer],
  );
  return result.rows[0] || null;
};

const updateGame = async (id, updates) => {
  const setClauses = [];
  const values = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = $${paramIdx}`);
    values.push(value);
    paramIdx++;
  }

  if (setClauses.length === 0) {
    return findById(id);
  }

  values.push(id);
  const query = `
    UPDATE games
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIdx}
    RETURNING *
  `;

  const result = await db.query(query, values);
  return result.rows[0] || null;
};

const addMove = async ({ gameId, moveNumber, playerColor, fromSquare, toSquare, promotion, fenBefore, fenAfter }) => {
  const result = await db.query(
    `INSERT INTO moves (game_id, move_number, player_color, from_square, to_square, promotion, fen_before, fen_after)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *
    `,
    [gameId, moveNumber, playerColor, fromSquare, toSquare, promotion || null, fenBefore, fenAfter],
  );
  return result.rows[0];
};

const getMoves = async (gameId) => {
  const result = await db.query(
    'SELECT * FROM moves WHERE game_id = $1 ORDER BY move_number ASC',
    [gameId],
  );
  return result.rows;
};

const getAllGames = async () => {
  const result = await db.query(
    `SELECT g.*,
            w.username AS white_username, w.rating AS white_rating,
            b.username AS black_username, b.rating AS black_rating,
            winner.username AS winner_username
     FROM games g
     LEFT JOIN users w ON g.white_player = w.id
     LEFT JOIN users b ON g.black_player = b.id
     LEFT JOIN users winner ON g.winner = winner.id
     ORDER BY g.created_at DESC`,
  );
  return result.rows;
};

const getSystemStats = async () => {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM games) AS total_games,
      (SELECT COUNT(*) FROM games WHERE status = 'active') AS active_games,
      (SELECT COUNT(*) FROM games WHERE status = 'completed') AS completed_games,
      (SELECT COUNT(*) FROM games WHERE status = 'waiting') AS waiting_games,
      (SELECT COUNT(*) FROM moves) AS total_moves,
      (SELECT COALESCE(AVG(rating), 1200)::INTEGER FROM users) AS average_rating,
      (SELECT username FROM users ORDER BY rating DESC LIMIT 1) AS top_player,
      (SELECT MAX(rating) FROM users) AS highest_rating
  `);

  return result.rows[0];
};

const getUserGameStats = async (userId) => {
  const result = await db.query(
    `SELECT
       COUNT(*) AS total_games,
       COUNT(*) FILTER (WHERE winner = $1) AS wins,
       COUNT(*) FILTER (WHERE (white_player = $1 OR black_player = $1) AND winner IS NOT NULL AND winner != $1) AS losses,
       COUNT(*) FILTER (WHERE (white_player = $1 OR black_player = $1) AND result = 'draw') AS draws,
       COUNT(*) FILTER (WHERE status = 'active' AND (white_player = $1 OR black_player = $1)) AS active_games,
       CASE
         WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE winner = $1)::numeric / COUNT(*) * 100), 1)
         ELSE 0
       END AS win_rate
     FROM games
     WHERE white_player = $1 OR black_player = $1`,
    [userId],
  );

  return result.rows[0];
};

module.exports = {
  create,
  findById,
  getActiveGames,
  joinGame,
  updateGame,
  addMove,
  getMoves,
  getAllGames,
  getSystemStats,
  getUserGameStats,
};
