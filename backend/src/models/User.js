const db = require('../config/database');

const findByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const findByUsername = async (username) => {
  const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await db.query(
    'SELECT id, username, email, rating, games_played, wins, losses, draws, role, created_at, updated_at FROM users WHERE id = $1',
    [id],
  );
  return result.rows[0] || null;
};

const create = async ({ username, email, passwordHash }) => {
  const result = await db.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, rating, games_played, wins, losses, draws, role, created_at, updated_at`,
    [username, email, passwordHash],
  );
  return result.rows[0];
};

const updateRating = async (id, newRating, resultType) => {
  const incrementMap = {
    win: 'wins',
    loss: 'losses',
    draw: 'draws',
  };
  const incrementCol = incrementMap[resultType] || null;
  let query;
  let params;

  if (incrementCol) {
    query = `
      UPDATE users
      SET rating = $2, games_played = games_played + 1, ${incrementCol} = ${incrementCol} + 1, updated_at = NOW()
      WHERE id = $1
      RETURNING id, username, email, rating, games_played, wins, losses, draws, role, created_at, updated_at
    `;
    params = [id, newRating];
  } else {
    query = `
      UPDATE users
      SET rating = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, username, email, rating, games_played, wins, losses, draws, role, created_at, updated_at
    `;
    params = [id, newRating];
  }

  const result = await db.query(query, params);
  return result.rows[0];
};

const getLeaderboard = async (limit = 50, timeframe = null) => {
  let query = `
    SELECT id, username, rating, games_played, wins, losses, draws,
           CASE
             WHEN games_played > 0 THEN ROUND((wins::numeric / games_played * 100), 1)
             ELSE 0
           END AS win_rate
    FROM users
    WHERE games_played > 0
  `;

  if (timeframe === 'week') {
    query += " AND updated_at > NOW() - INTERVAL '7 days'";
  } else if (timeframe === 'month') {
    query += " AND updated_at > NOW() - INTERVAL '30 days'";
  }

  query += ' ORDER BY rating DESC LIMIT $1';

  const result = await db.query(query, [limit]);
  return result.rows;
};

const searchPlayers = async (searchTerm, limit = 10) => {
  const result = await db.query(
    `SELECT id, username, rating, games_played
     FROM users
     WHERE username ILIKE $1
     ORDER BY rating DESC
     LIMIT $2`,
    [`%${searchTerm}%`, limit],
  );
  return result.rows;
};

const getAllUsers = async () => {
  const result = await db.query(
    `SELECT id, username, email, rating, games_played, wins, losses, draws, role, created_at, updated_at
     FROM users ORDER BY created_at DESC`,
  );
  return result.rows;
};

const deleteUser = async (id) => {
  const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
};

const updateRole = async (id, role) => {
  const result = await db.query(
    `UPDATE users SET role = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, username, email, rating, games_played, wins, losses, draws, role, created_at, updated_at`,
    [id, role],
  );
  return result.rows[0] || null;
};

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  create,
  updateRating,
  getLeaderboard,
  searchPlayers,
  getAllUsers,
  deleteUser,
  updateRole,
};
