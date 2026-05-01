# Chess3D — Three-Dimensional Online Chess

Online chess platform with 3D visualization, real-time multiplayer, and ELO ranking.

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Frontend    | React + Three.js (React Three Fiber)  |
| Backend     | Node.js + Express + Socket.IO         |
| Database    | PostgreSQL                            |
| Auth        | JWT (JSON Web Tokens)                 |
| Deployment  | Render (API + DB), Netlify (Frontend) |

## Features

- **3D Chess Board** — Fully interactive 3D board built with Three.js
- **Real-Time Multiplayer** — WebSocket-powered matches via Socket.IO
- **User Authentication** — JWT-based signup, login, and session management
- **ELO Rating System** — Track player skill with Glicko-2 / ELO algorithm
- **Game History** — Replay past games move by move
- **Admin Panel** — Manage users, games, and system settings
- **Responsive Design** — Play on desktop and mobile browsers

## Getting Started (Local Development)

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Setup

```bash
# Clone the repo
git clone https://github.com/meckoded/chess3d.git
cd chess3d

# Install all dependencies
npm run install:all

# Start PostgreSQL via Docker
docker compose up -d

# Copy environment file and fill in values
cp backend/.env.example backend/.env

# Start backend (port 3001)
npm run dev:backend

# In another terminal, start frontend (port 5173)
npm run dev:frontend
```

### Environment Variables

| Variable          | Description                  | Default                         |
|-------------------|------------------------------|----------------------------------|
| `DATABASE_URL`    | PostgreSQL connection string | `postgres://chess3d:chess3d_dev@localhost:5432/chess3d` |
| `JWT_SECRET`      | JWT signing secret           | _(generate for production)_      |
| `NODE_ENV`        | Environment mode             | `development`                    |
| `PORT`            | Backend server port          | `3001`                           |
| `CORS_ORIGIN`     | Allowed frontend origin      | `http://localhost:5173`          |
| `VITE_API_URL`    | Backend API URL (frontend)   | `http://localhost:3001/api`      |

## Deployment

| Service  | URL |
|----------|-----|
| Frontend | _Netlify — set after deploy_ |
| API      | _Render — set after deploy_  |

---

Built with ❤️
