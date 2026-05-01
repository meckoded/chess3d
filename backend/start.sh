#!/bin/bash
cd /home/node/.openclaw/workspace/coder/chess3d/backend
export NODE_ENV=production
export PORT=3001
exec node src/server.js
