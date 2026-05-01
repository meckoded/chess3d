const db = require('../config/database');
const logger = require('../config/logger');

const migrate = async () => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    logger.info('Running database migrations...');

    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rating INTEGER DEFAULT 1200,
        games_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        white_player UUID REFERENCES users(id),
        black_player UUID REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'waiting',
        pgn TEXT,
        fen VARCHAR(255) DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        winner UUID REFERENCES users(id),
        result VARCHAR(20),
        time_control INTEGER DEFAULT 600,
        created_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS moves (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID REFERENCES games(id) ON DELETE CASCADE,
        move_number INTEGER NOT NULL,
        player_color VARCHAR(5) NOT NULL,
        from_square VARCHAR(2) NOT NULL,
        to_square VARCHAR(2) NOT NULL,
        promotion VARCHAR(1),
        fen_before VARCHAR(255) NOT NULL,
        fen_after VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
      CREATE INDEX IF NOT EXISTS idx_games_white_player ON games(white_player);
      CREATE INDEX IF NOT EXISTS idx_games_black_player ON games(black_player);
      CREATE INDEX IF NOT EXISTS idx_moves_game_id ON moves(game_id);
      CREATE INDEX IF NOT EXISTS idx_moves_game_id_move_number ON moves(game_id, move_number);
      CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    await client.query('COMMIT');
    logger.info('Database migrations completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await db.pool.end();
  }
};

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
