const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'chess3d.db');

// Ensure parent directory exists (Render doesn't create /var/data/ for us)
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

const getDb = () => {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
  }
  return db;
};

const query = (sql, params = []) => {
  const db = getDb();
  return db.prepare(sql).all(...params);
};

const run = (sql, params = []) => {
  const db = getDb();
  return db.prepare(sql).run(...params);
};

const get = (sql, params = []) => {
  const db = getDb();
  return db.prepare(sql).get(...params);
};

const getClient = () => getDb();

const close = () => {
  if (db) {
    db.close();
    db = null;
  }
};

module.exports = { query, run, get, getClient, getDb, close };
