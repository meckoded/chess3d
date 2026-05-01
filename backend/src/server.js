require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger');
const { generalLimiter } = require('./middleware/rateLimiter');
const { setupGameHandler } = require('./socket/gameHandler');

// Import routes
const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// ============================================================
// Socket.io Setup
// ============================================================
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
  maxHttpBufferSize: 1e6, // 1MB
});

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-eval'", "blob:"],
      scriptSrcElem: ["'self'", "'unsafe-eval'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================
// Body Parsing
// ============================================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================================
// Rate Limiting
// ============================================================
app.use('/api/', generalLimiter);

// ============================================================
// Health Check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================
// Debug Routes (must be BEFORE static files & catch-all)
// ============================================================
app.get('/api/debug', (req, res) => {
  const info = {
    node: process.version,
    plat: process.platform,
    cwd: process.cwd(),
    env: process.env.NODE_ENV,
    hasDb: false,
    hasMigrate: false,
  };
  try {
    const db = require('./config/database');
    db.run('SELECT 1');
    info.hasDb = true;
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'");
    info.tables = tables.map(t => t.name);
  } catch(e) { info.dbError = e.message; }
  try {
    require('./config/migrate');
    info.hasMigrate = true;
  } catch(e) { info.migrateError = e.message; }
  res.json(info);
});

// ============================================================
// Static Files (Frontend SPA) — must be AFTER API routes
// ============================================================
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ============================================================
// 404 Handler (API-only, non-existent API paths)
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use((err, req, res, _next) => {
  logger.error('Unhandled error:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ============================================================
// Socket.io Game Handler
// ============================================================
setupGameHandler(io);

// ============================================================
// Auto-migration + Start Server
// ============================================================
const PORT = parseInt(process.env.PORT, 10) || 3001;

const start = async () => {
  // Run database migrations before accepting connections
  try {
    const migrate = require('./config/migrate');
    await migrate();
    logger.info('Database migrations completed');
  } catch (err) {
    logger.error('Migration failed, starting anyway:', err.message);
  }

  server.listen(PORT, () => {
    logger.info(`Chess3D server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info(`CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    logger.info(`WebSocket ready for game connections`);
  });
};

start();

// ============================================================
// Graceful Shutdown
// ============================================================
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  server.close(() => {
    logger.info('HTTP server closed');
    io.close(() => {
      logger.info('Socket.io server closed');
    });
  });

  // Close database
  try {
    const db = require('./config/database');
    db.close();
    logger.info('Database closed');
  } catch (err) {
    logger.error('Error closing database:', err);
  }

  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

module.exports = { app, server, io };


