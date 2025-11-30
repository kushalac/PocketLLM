# PocketLLM

A full-stack AI chat application with Ollama LLM integration, MongoDB persistence, JWT authentication, and admin dashboard for configuring global model settings.

## Features

- ✅ **AI Chat** - Real-time chat with Llama 2 LLM via Ollama
- ✅ **Sessions** - Create, organize, and export conversations
- ✅ **Admin Dashboard** - Configure global model settings for all users
- ✅ **Authentication** - JWT-based register/login system
- ✅ **MongoDB** - Persistent storage with Mongoose ODM
- ✅ **Docker** - Complete Docker Compose setup with all services
- ✅ **Caching** - Multi-tier caching (IndexedDB → Memory → DB)

## Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- Or Node.js 20+ for local development

### Start with Docker (Recommended)

```bash
cd backend
docker-compose up --build
```

Access at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Ollama: http://localhost:11434

**First startup takes 2-5 minutes** (Ollama downloads ~4GB Llama 2 model)

### Local Development

**Terminal 1 - Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start
```

## Configuration

### Backend (.env)
```bash
PORT=5000
NODE_ENV=development
JWT_SECRET=dev_secret_key_change_in_production
MONGODB_URI=mongodb://root:password@localhost:27017/pocketllm?authSource=admin
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama2:7b-chat
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, React Router, Axios, TailwindCSS |
| **Backend** | Node.js, Express, MongoDB, Mongoose |
| **LLM** | Ollama with Llama 2 7B Chat |
| **Infrastructure** | Docker, Docker Compose |

## Admin Dashboard

**Access**: Go to `/admin` (admin users only)

### Global Model Settings

Configure settings that apply to **all users**:
- Response Timeout (10-300 seconds)
- Cache TTL (30-3600 seconds)
- Quality Threshold (0-1)
- Request Throttle (10-1000 per minute)
- Context Window Size (1-20 messages)
- Max Response Length (500-8000 tokens)

When admin changes a setting, all users see it immediately on next request.

**For detailed admin documentation**: See [ADMIN_SETTINGS.md](./ADMIN_SETTINGS.md)

## Project Structure

```
frontend/                 # React app
├── src/features/        # Chat, Auth, Admin
└── src/components/      # UI components

backend/                 # Express API
├── models/             # MongoDB schemas
├── controllers/        # Route handlers
├── services/          # Business logic
├── routes/            # API endpoints
├── middleware/        # Auth, validation
└── db/                # Database connection

ADMIN_SETTINGS.md       # Admin dashboard guide
SETUP.md               # Detailed setup
docker-compose.yml     # All services
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service status |
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/chat/start-session` | New chat |
| `POST` | `/api/chat/message` | Send message (SSE) |
| `GET` | `/api/admin/model-settings` | Get global settings |
| `POST` | `/api/admin/model-settings` | Update settings (admin only) |

## Troubleshooting

### Ollama not connecting
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Restart
docker-compose restart ollama
```

### MongoDB connection error
- Verify `.env` credentials match `docker-compose.yml`
- Check logs: `docker-compose logs mongodb`

### Port already in use
```bash
# Use different project name
docker-compose -p myproject up
```

### Can't login
- Ensure backend is running: `curl http://localhost:5000/api/health`
- Check browser console (F12) for errors
- Verify MongoDB is connected

## Project Components

- **Frontend** - React app with chat interface, user settings, and admin dashboard
- **Backend** - Express API with MongoDB models and Ollama integration
- **Ollama** - Local LLM inference engine (Llama 2 7B Chat)
- **MongoDB** - Persistent document storage

## Deployment

### Production MongoDB
Use MongoDB Atlas: [https://atlas.mongodb.com](https://atlas.mongodb.com)

Update `.env`:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/pocketllm
```

### Production Ollama
Install Ollama on server: [https://ollama.ai](https://ollama.ai)

Update `.env`:
```
OLLAMA_URL=http://server-ip:11434/api/generate
```

### Security Checklist
- ✅ Generate strong JWT secret: `openssl rand -base64 32`
- ✅ Set `NODE_ENV=production`
- ✅ Use environment variables for all secrets
- ✅ Enable HTTPS on frontend
- ✅ Use MongoDB Atlas with IP whitelist

## Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | This file - project overview |
| `ADMIN_SETTINGS.md` | **Admin dashboard & global settings** |
| `SETUP.md` | Detailed setup instructions |
| `API_DOCUMENTATION.md` | Complete API reference |

## License

MIT

---

**Last Updated**: November 2025  
**Status**: Production Ready ✅

