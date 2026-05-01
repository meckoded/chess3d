const crypto = require('crypto');
const db = require('../config/database');

const generateId = () => crypto.randomUUID();

const findByEmail = async (email) => {
  return db.get('SELECT * FROM users WHERE email = ?', [email]) || null;
};

const findByUsername = async (username) => {
  return db.get('SELECT * FROM users WHERE username = ?', [username]) || null;
};

const findById = async (id) => {
  return db.get(
    'SELECT id, username, email, rating, games_played, wins, losses, draws, role, created_at, updated_at FROM users WHERE id = ?',
    [id],
  ) || null;
};

const create = async ({ username, email, passwordHash }) => {
  const id = generateId();
  db.run(
    `INSERT INTO users (id, username, email, password_hash, rating, games_played, wins, losses, draws, role)
     VALUES (?, ?, ?, ?, 1200, 0, 0, 0, 0, 'user')`,
    [id, username, email, passwordHash],
  );
  return findById(id);
};

const updateRefreshToken = async (id, refreshToken, expiresAt) => {
  db.run(
    `UPDATE users SET refresh_token = ?, refresh_token_expires_at = ?, updated_at = datetime('now') WHERE id = ?`,
    [refreshToken, expiresAt, id],
  );
};

const findByRefreshToken = async (token) => {
  return db.get(
    `SELECT * FROM users WHERE refresh_token = ? AND refresh_token_expires_at > datetime('now')`,
    [token],
  ) || null;
};

const clearRefreshToken = async (id) => {
  db.run(
    `UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL, updated_at = datetime('now') WHERE id = ?`,
    [id],
  );
};

const getAllUsers = async () => {
  return db.query(
    'SELECT id, username, email, rating, games_played, wins, losses, draws, role, created_at, updated_at FROM users ORDER BY rating DESC',
  );
};

const updateRating = async (id, rating, result) => {
  const field = result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draws';
  db.run(
    `UPDATE users SET rating = ?, games_played = games_played + 1, ${field} = ${field} + 1, updated_at = datetime('now') WHERE id = ?`,
    [rating, id],
  );
};

const setRole = async (id, role) => {
  db.run(
    `UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?`,
    [role, id],
  );
};

const deleteUser = async (id) => {
  db.run('DELETE FROM users WHERE id = ?', [id]);
};

const getLeaderboard = async (limit = 50) => {
  return db.query(
    'SELECT id, username, rating, games_played, wins, losses, draws FROM users ORDER BY rating DESC LIMIT ?',
    [limit],
  );
};

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  create,
  updateRefreshToken,
  findByRefreshToken,
  clearRefreshToken,
  getAllUsers,
  updateRating,
  setRole,
  deleteUser,
  getLeaderboard,
};
