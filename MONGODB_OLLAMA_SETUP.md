# MongoDB & Ollama Setup Guide

## Overview
This application now uses:
- **MongoDB Atlas** for data persistence (users, chat sessions, messages)
- **Ollama with Llama 3.1** for local LLM inference
- **Docker Compose** to run everything together

## Prerequisites
- Docker & Docker Compose installed
- MongoDB Atlas account (for production) or local MongoDB
- Ollama installed or running via Docker

## Quick Start with Docker Compose

### 1. Clone and Navigate
\`\`\`bash
cd backend
\`\`\`

### 2. Run Everything
\`\`\`bash
docker-compose up --build
\`\`\`

This will start:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Ollama LLM**: http://localhost:11434
- **MongoDB**: localhost:27017 (internal)

### 3. Wait for Services
The first startup takes ~2-5 minutes:
- Ollama downloads Llama 2 7B Chat model (~4GB)
- MongoDB initializes
- Backend connects

Check logs for "Database initialized successfully"

## Manual Setup (No Docker)

### 1. Install Ollama
- Download from [ollama.ai](https://ollama.ai)
- Run: `ollama serve`
- In another terminal: `ollama pull llama2:7b-chat`

### 2. Install MongoDB
- Option A: Local MongoDB
  - Download from [mongodb.com](https://mongodb.com)
  - Run MongoDB service
  
- Option B: MongoDB Atlas (Cloud)
  - Create account at [atlas.mongodb.com](https://atlas.mongodb.com)
  - Create cluster and get connection string
  - Update `MONGODB_URI` in `.env`

### 3. Install Backend
\`\`\`bash
cd backend
npm install
\`\`\`

### 4. Create .env File
\`\`\`bash
cp .env.example .env
\`\`\`

Update these values:
\`\`\`
# For Local MongoDB
MONGODB_URI=mongodb://localhost:27017/pocketllm

# For MongoDB Atlas (production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pocketllm?retryWrites=true&w=majority

# Ollama Settings
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama2:7b-chat
\`\`\`

### 5. Start Backend
\`\`\`bash
npm run dev
\`\`\`

## Available Models

You can use different Ollama models by changing `OLLAMA_MODEL`:

\`\`\`bash
# Pull model
ollama pull llama2:13b-chat

# Set in .env
OLLAMA_MODEL=llama2:13b-chat
\`\`\`

Popular options:
- `llama2:7b-chat` (7GB, ~20s/response)
- `llama2:13b-chat` (25GB, ~40s/response)
- `neural-chat:7b` (4GB, faster)
- `mistral:7b` (5GB, better performance)

## Database Schema

### Users Collection
\`\`\`javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  is_admin: Boolean,
  created_at: Date
}
\`\`\`

### ChatSessions Collection
\`\`\`javascript
{
  _id: String (UUID),
  user_id: ObjectId (ref: User),
  title: String,
  created_at: Date,
  updated_at: Date
}
\`\`\`

### Messages Collection
\`\`\`javascript
{
  _id: String (UUID),
  session_id: String (ref: ChatSession),
  user_id: ObjectId (ref: User),
  role: String (enum: ['user', 'assistant']),
  content: String,
  created_at: Date
}
\`\`\`

## Troubleshooting

### Ollama not connecting
\`\`\`bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
docker-compose restart ollama
\`\`\`

### MongoDB connection failed
\`\`\`bash
# Check MongoDB logs
docker-compose logs mongodb

# Verify credentials in .env match docker-compose.yml
\`\`\`

### Model not found
\`\`\`bash
# List available models
ollama list

# Pull required model
ollama pull llama2:7b-chat
\`\`\`

### Port already in use
\`\`\`bash
# Change ports in docker-compose.yml or use different port
docker-compose up -p custom_project_name
\`\`\`

## Production Deployment

### MongoDB Atlas
1. Create cluster at [atlas.mongodb.com](https://atlas.mongodb.com)
2. Get connection string with credentials
3. Set `MONGODB_URI=mongodb+srv://...`
4. Ensure IP allowlist includes your deployment server

### Ollama on Server
- Install Ollama on server
- Set `OLLAMA_URL=http://server-ip:11434/api/generate`
- Ensure port 11434 is accessible from backend

### Environment Variables
Set these in production:
\`\`\`bash
JWT_SECRET=<generate-secure-random-string>
MONGODB_URI=<production-mongodb-uri>
OLLAMA_URL=<production-ollama-url>
OLLAMA_MODEL=llama2:7b-chat
NODE_ENV=production
\`\`\`

## API Health Check
\`\`\`bash
curl http://localhost:5000/api/health
\`\`\`

Response:
\`\`\`json
{
  "status": "ok",
  "ollama": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`
