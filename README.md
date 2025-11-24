# PocketLLM Portal

A full-stack AI chat application with Ollama LLM integration, MongoDB persistence, user authentication, and admin dashboard.

## Features

- **Ollama LLM Integration**: Run Llama 2 or other models locally for AI responses
- **MongoDB Persistence**: Secure data storage with MongoDB Atlas support
- **User Authentication**: JWT-based register/login system
- **Chat Sessions**: Create, rename, delete, and export conversations
- **Real-time Streaming**: SSE streaming for smooth chat responses
- **Admin Dashboard**: Monitor metrics, logs, and system stats
- **Docker Support**: Complete Docker Compose setup with all services

## Database

**MongoDB** is used for persistent storage with Mongoose ODM.

- **Options**: MongoDB Atlas (cloud) or local MongoDB
- **Collections**: users, chat_sessions, messages, logs
- **Docker**: MongoDB container auto-initialized with credentials
- **Connection**: `MONGODB_URI` environment variable

## Tech Stack

### Frontend
- React 18
- React Router v6
- Axios
- TailwindCSS (responsive styling)

### Backend
- Node.js + Express
- **MongoDB** with Mongoose ODM
- **Ollama** LLM API integration
- JWT Authentication
- Server-Sent Events (SSE) for streaming

### Infrastructure
- Docker & Docker Compose
- Ollama container with Llama 2 7B Chat model

## Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- Node.js 20+ (for local development)

### Option 1: Docker Compose (Recommended)

\`\`\`bash
cd backend
docker-compose up --build
\`\`\`

Services start at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Ollama: http://localhost:11434
- MongoDB: localhost:27017 (internal)

First startup takes 2-5 minutes (Ollama downloads ~4GB Llama 2 model).

### Option 2: Local Development

**Terminal 1 - Backend:**
\`\`\`bash
cd backend
npm install
cp .env.example .env
# Update MONGODB_URI in .env
npm run dev
\`\`\`

**Terminal 2 - Frontend:**
\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

## Environment Configuration

### Backend (.env)
\`\`\`bash
PORT=5000
NODE_ENV=development
JWT_SECRET=dev_secret_key_change_in_production
MONGODB_URI=mongodb://root:password@localhost:27017/pocketllm?authSource=admin
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama2:7b-chat
\`\`\`

### Frontend (.env)
\`\`\`
REACT_APP_API_URL=http://localhost:5000/api
\`\`\`

## MongoDB Setup

### Local MongoDB
\`\`\`bash
# Install MongoDB or use Docker
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=password mongo:7.0
\`\`\`

### MongoDB Atlas (Production)
1. Create account at [atlas.mongodb.com](https://atlas.mongodb.com)
2. Create cluster and get connection string
3. Update `MONGODB_URI` with production credentials

## Ollama Configuration

### Using Default Model
The setup automatically uses `llama2:7b-chat`. To use a different model:

\`\`\`bash
# Pull different model
docker-compose exec ollama ollama pull mistral:7b

# Update .env
OLLAMA_MODEL=mistral:7b
\`\`\`

### Popular Models
- `llama2:7b-chat` - Default, balanced performance
- `neural-chat:7b` - Faster responses (~10s)
- `mistral:7b` - Better quality (~15s)
- `llama2:13b-chat` - More powerful (~40s, requires 25GB)

## Troubleshooting

### Ollama not connecting
\`\`\`bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart Ollama service
docker-compose restart ollama
\`\`\`

### MongoDB connection failed
\`\`\`bash
# Verify credentials in .env match docker-compose.yml
# Check MongoDB logs
docker-compose logs mongodb
\`\`\`

### Signup/Login fails
- Ensure backend is running on port 5000
- Check browser console (F12) for errors
- Verify MongoDB is connected: `curl http://localhost:5000/api/health`

### No styling visible
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Restart frontend

### Port already in use
Change ports in `docker-compose.yml` or use custom project name:
\`\`\`bash
docker-compose -p custom_name up
\`\`\`

## Project Structure

\`\`\`
.
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── core/
│   │   ├── features/
│   │   ├── components/
│   │   └── index.jsx
│   └── package.json
│
├── backend/                  # Node.js backend
│   ├── models/               # New: Mongoose models
│   │   ├── User.js
│   │   ├── ChatSession.js
│   │   ├── Message.js
│   │   └── Log.js
│   ├── services/
│   │   ├── ChatService.js    # Updated for MongoDB
│   │   ├── LLMService.js     # Updated for Ollama
│   │   ├── CacheService.js
│   │   ├── MetricsService.js
│   │   └── LogService.js
│   ├── controllers/
│   ├── routes/
│   ├── db/
│   │   └── connection.js     # Updated for MongoDB
│   ├── server.js             # Added health check
│   └── package.json
│
├── MONGODB_OLLAMA_SETUP.md   # New: Detailed setup guide
├── docker-compose.yml        # Added Ollama & MongoDB services
├── README.md
└── Dockerfile
\`\`\`

## API Reference

### Health Check
\`\`\`
GET /api/health
\`\`\`

Returns service status including Ollama connection.

### Authentication
\`\`\`
POST /api/auth/register
POST /api/auth/login
\`\`\`

### Chat
\`\`\`
POST /api/chat/start-session
GET /api/chat/sessions
POST /api/chat/message          # SSE streaming
PUT /api/chat/:sessionId/rename
DELETE /api/chat/:sessionId
GET /api/chat/:sessionId/export
\`\`\`

### Admin
\`\`\`
GET /api/admin/metrics
GET /api/admin/cache-stats
GET /api/admin/logs
\`\`\`

## Docker Deployment

\`\`\`bash
cd backend
docker-compose up --build
\`\`\`

Services:
- **Frontend**: React app on port 3000
- **Backend**: Express API on port 5000
- **Ollama**: LLM inference on port 11434
- **MongoDB**: Document database (internal)

All services are configured to communicate automatically.

## Production Deployment

### MongoDB Atlas
Set `MONGODB_URI` to your Atlas connection string:
\`\`\`
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pocketllm?retryWrites=true&w=majority
\`\`\`

### Ollama on Server
Install Ollama and set:
\`\`\`
OLLAMA_URL=http://server-ip:11434/api/generate
\`\`\`

### Security
\`\`\`bash
# Generate secure JWT secret
openssl rand -base64 32

# Set in environment
JWT_SECRET=<generated-secret>
NODE_ENV=production
\`\`\`

## Documentation

- **MONGODB_OLLAMA_SETUP.md** - Detailed MongoDB & Ollama setup
- **SETUP.md** - Comprehensive setup guide
- **QUICK_START.md** - Quick reference

## Support

For issues:
1. Check Troubleshooting section
2. Review logs: `docker-compose logs -f`
3. Check API health: `curl http://localhost:5000/api/health`
4. See MONGODB_OLLAMA_SETUP.md for detailed guidance

## License

MIT
