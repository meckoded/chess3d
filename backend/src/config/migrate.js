const db = require('./database');
const logger = require('./logger');

const migrate = async () => {
  try {
    logger.info('Running database migrations...');

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        rating INTEGER DEFAULT 1200,
        games_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        role TEXT DEFAULT 'user' CHECK(role IN ('user','admin')),
        refresh_token TEXT,
        refresh_token_expires_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC)
    `);
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        white_player TEXT NOT NULL REFERENCES users(id),
        black_player TEXT REFERENCES users(id),
        fen TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn TEXT DEFAULT '',
        status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting','active','completed','draw','resigned','aborted')),
        result TEXT CHECK(result IN ('white','black','draw',NULL)),
        time_control INTEGER DEFAULT 600,
        white_time INTEGER,
        black_time INTEGER,
        last_move_at TEXT,
        winner TEXT REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)
    `);
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_games_white ON games(white_player)
    `);
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_games_black ON games(black_player)
    `);

    logger.info('Database migrations completed successfully');
  } catch (err) {
    logger.error('Migration error:', err);
    throw err;
  }
};

module.exports = migrate;
