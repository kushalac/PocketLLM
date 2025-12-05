# PocketLLM Portal

A privacy-first, full-stack AI assistant running entirely on your local machine. Built with MERN stack and Ollama for local LLM inference, featuring document-based RAG, multi-tier caching, and admin controls.

## Features

- **Local AI Chat** - Streaming responses from Llama 2 7B (4-bit quantized)
- **Document RAG** - Upload documents for context-aware, cited answers
- **Session Management** - Organize, rename, search, and export conversations
- **Admin Dashboard** - Configure model settings, view metrics, manage system
- **JWT Authentication** - Secure login with role-based access control
- **Multi-Tier Caching** - IndexedDB → Memory → MongoDB for optimal performance
- **100% Private** - No data leaves your machine, verified with network monitoring
- **Docker Deployment** - One-command setup with containerized services

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Minimum 16GB RAM, 10GB disk space, 4 CPU cores recommended

### Installation

1. Extract the ZIP file
2. Open terminal in the extracted folder
3. Run:

```bash
docker-compose up --build
```

### Access
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Ollama**: http://localhost:11434

⏱️ **First startup**: 3-5 minutes (downloads ~4GB Llama 2 model)

### Create Account & Grant Admin

1. Register at http://localhost:3000
2. To make a user admin:

```bash
docker exec pocket-llm-portal-build-latest-1-backend-1 node scripts/makeAdmin.js <username>
```

**Note:** User must logout and login again after admin grant (JWT refresh required)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, React Router, TailwindCSS |
| **Backend** | Node.js, Express, MongoDB, Mongoose |
| **LLM** | Ollama + Llama 2 7B Chat (4-bit) |
| **Caching** | IndexedDB, Memory LRU, MongoDB |
| **Auth** | JWT with RBAC |
| **Deploy** | Docker Compose |

## Source Code Structure

```
pocket-llm-portal-build-latest-1/
│
├── frontend/                      # React Application (Port 3000)
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/             # Authentication pages & components
│   │   │   │   ├── AuthPages.jsx
│   │   │   │   └── AuthContext.jsx
│   │   │   ├── chat/             # Chat interface & RAG components
│   │   │   │   ├── ChatInterface.jsx
│   │   │   │   └── DocsPanel.jsx
│   │   │   ├── admin/            # Admin dashboard (metrics, settings, logs)
│   │   │   │   └── AdminDashboard.jsx
│   │   │   └── history/          # Session history & export
│   │   │       └── HistoryPage.jsx
│   │   ├── core/                 # Core utilities
│   │   │   ├── IndexedDBCache.js # Frontend caching layer
│   │   │   └── api.js            # Axios API client
│   │   ├── App.jsx               # Main routing & navigation
│   │   └── index.js              # Entry point
│   ├── Dockerfile                # Frontend container config
│   └── package.json              # Frontend dependencies
│
├── backend/                       # Node.js Express API (Port 5000)
│   ├── models/                   # MongoDB Mongoose schemas
│   │   ├── User.js               # User accounts with roles
│   │   ├── ChatSession.js        # Chat session metadata
│   │   ├── Message.js            # Individual messages
│   │   ├── Document.js           # Uploaded documents for RAG
│   │   ├── AdminSettings.js      # Global model configuration
│   │   ├── Metrics.js            # System metrics
│   │   └── Log.js                # System logs
│   ├── controllers/              # Route handlers
│   │   ├── authController.js     # Register, login, JWT generation
│   │   ├── chatController.js     # Chat & RAG operations
│   │   ├── adminController.js    # Admin operations (metrics, cache, logs)
│   │   └── preferencesController.js
│   ├── services/                 # Business logic layer
│   │   ├── ChatService.js        # Session & message management
│   │   ├── LLMService.js         # Ollama HTTP client & streaming
│   │   ├── DocumentService.js    # TF-IDF retrieval for RAG
│   │   ├── CacheService.js       # In-memory LRU cache
│   │   ├── MetricsService.js     # System metrics aggregation
│   │   └── LogService.js         # Logging operations
│   ├── routes/                   # API endpoints
│   │   ├── auth.js               # /api/auth/*
│   │   ├── chat.js               # /api/chat/*
│   │   ├── admin.js              # /api/admin/* (protected)
│   │   └── preferences.js
│   ├── middleware/               # Express middleware
│   │   ├── authMiddleware.js     # JWT validation
│   │   └── adminMiddleware.js    # Admin role check
│   ├── scripts/                  # Utility scripts
│   │   ├── makeAdmin.js          # Grant admin privileges
│   │   ├── listUsers.js          # List all users
│   │   └── clearAll.js           # Clear database
│   ├── db/
│   │   └── connection.js         # MongoDB connection
│   ├── server.js                 # Express server entry point
│   ├── Dockerfile                # Backend container config
│   └── package.json              # Backend dependencies
│
├── deliverables/                  # Project documentation & UML
│   ├── report.md                 # Architectural implementation report
│   ├── VIDEO_SCRIPT.md           # Demo video script
│   └── *.puml                    # UML diagrams (component, deployment, use case)
│
├── docker-compose.yml             # Multi-container orchestration
│   # Services: frontend, backend, mongodb, ollama
│
├── ADMIN_SETTINGS.md              # Admin dashboard user guide
├── API_DOCUMENTATION.md           # Complete API reference
├── QUICK_START.md                 # Quick setup guide
├── SETUP.md                       # Detailed installation instructions
└── README.md                      # This file
```

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, React Router 6 | Single-page application with routing |
| **UI Framework** | TailwindCSS | Styling and responsive design |
| **Backend** | Node.js 20, Express.js | REST API server |
| **Database** | MongoDB 7.0 | Persistent data storage |
| **ORM** | Mongoose | MongoDB object modeling |
| **LLM** | Ollama + Llama 2 7B Chat | Local language model inference |
| **Caching** | IndexedDB + Memory LRU | Multi-tier caching strategy |
| **Auth** | JWT (jsonwebtoken) | Stateless authentication |
| **Deployment** | Docker Compose | Container orchestration |

### Architecture Highlights

**Frontend**: React SPA with AuthContext, IndexedDBCache, ChatInterface (SSE streaming), DocsPanel (RAG), AdminDashboard

**Backend**: Express API with ChatService (sessions), LLMService (Ollama client), DocumentService (TF-IDF retrieval), CacheService (LRU)

**Data Flow**: User message → JWT auth → TF-IDF document retrieval → Augmented prompt → Ollama → SSE stream → Frontend → MongoDB

**Docker Services**: Frontend (Nginx:3000), Backend (Node:5000), MongoDB (7.0:27017), Ollama (11434)

## Usage

**Chat**: Send messages, stop/regenerate responses, rename/search/delete sessions

**Documents (RAG)**: Upload .txt/.md files via "Docs" button → Relevant docs auto-retrieved as context → Get cited answers

**History**: View all sessions, export as JSON, see timestamps and message counts

**Admin** (http://localhost:3000/admin):
- **Metrics**: Users, sessions, messages, active users, cache hit rate, DB status
- **Maintenance**: Clear cache/logs, view recent logs
- **Settings**: Context window (1-20 messages), max response length (500-8000 chars)

## Key Features

**Multi-Tier Caching**: IndexedDB (frontend) → LRU Memory (60s TTL, backend) → MongoDB → Result: 70% query reduction, <5ms responses

**RAG Pipeline**: Upload docs → Query tokenized/stemmed (Porter) → TF-IDF scoring → Top 3 docs (score >0.3) → Context prepended → LLM generates cited response

**SSE Streaming**: Real-time token streaming (Ollama → Backend → Frontend), stoppable mid-generation, handles backpressure

**Privacy**: 100% local execution, no external calls, no telemetry, network-verified

## API Documentation

For complete API reference including all endpoints, request/response formats, authentication details, and code examples, see **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**.

---

**CSCI 578 Software Architectures - Fall 2025** | University of Southern California  

