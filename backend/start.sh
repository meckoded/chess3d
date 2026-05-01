#!/bin/bash
cd "$(dirname "$0")"
node src/config/migrate.js
exec node src/server.js
