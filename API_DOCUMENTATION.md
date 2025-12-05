# PocketLLM API Documentation

**Base URL**: `http://localhost:3000`

**Authentication**: JWT Bearer Token (required for most endpoints)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Chat Management](#chat-management)
3. [Message Operations](#message-operations)
4. [Admin Operations](#admin-operations)
5. [Error Handling](#error-handling)
6. [Rate Limiting & Caching](#rate-limiting--caching)

---

## Authentication

### Login
Create a new user session and receive JWT token.

```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "is_admin": false,
    "created_at": "2025-11-28T10:30:00Z"
  }
}
```

**Error (401 Unauthorized)**:
```json
{
  "error": "Invalid credentials"
}
```

---

### Register
Create a new user account.

```http
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response (201 Created)**:
```json
{
  "message": "User created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe"
  }
}
```

**Error (400 Bad Request)**:
```json
{
  "error": "Username already exists"
}
```

---

### Verify Token
Validate current JWT token.

```http
GET /auth/verify
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "valid": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe"
  }
}
```

---

## Chat Management

### Start Session
Create a new chat session.

```http
POST /chat/start
Authorization: Bearer <token>
Content-Type: application/json
```

**Response (200 OK)**:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Get Sessions
Retrieve all chat sessions for the current user.

```http
GET /chat/sessions
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Max sessions to return (default: 50) |
| `skip` | integer | Skip N sessions for pagination (default: 0) |

**Response (200 OK)**:
```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Understanding React Hooks",
      "created_at": "2025-11-28T10:30:00Z",
      "updated_at": "2025-11-28T14:45:30Z",
      "message_count": 12
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Node.js Best Practices",
      "created_at": "2025-11-27T09:15:00Z",
      "updated_at": "2025-11-27T16:20:15Z",
      "message_count": 8
    }
  ]
}
```

---

### Get Session Details
Retrieve a specific session with metadata.

```http
GET /chat/session/:sessionId
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Understanding React Hooks",
    "created_at": "2025-11-28T10:30:00Z",
    "updated_at": "2025-11-28T14:45:30Z",
    "message_count": 12,
    "title_locked": false
  }
}
```

---

### Rename Session
Update session title.

```http
PATCH /chat/rename/:sessionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Session Title"
}
```

**Response (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "New Session Title"
}
```

---

### Delete Session
Delete an entire chat session and all its messages.

```http
DELETE /chat/session/:sessionId
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "message": "Session deleted successfully"
}
```

---

### Export Session
Export session data (useful for backup/analysis).

```http
GET /chat/export/:sessionId
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | string | Export format: `json` (default) or `csv` |

**Response (200 OK)**:
```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Understanding React Hooks",
    "created_at": "2025-11-28T10:30:00Z"
  },
  "messages": [
    {
      "id": "msg-001",
      "role": "user",
      "content": "What are React Hooks?",
      "created_at": "2025-11-28T10:31:00Z"
    },
    {
      "id": "msg-002",
      "role": "assistant",
      "content": "React Hooks are...",
      "created_at": "2025-11-28T10:31:05Z"
    }
  ]
}
```

---

## Message Operations

### Send Message
Send a message and stream the LLM response.

```http
POST /chat/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "What are React Hooks?"
}
```

**Response (200 OK - Server-Sent Events)**:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"content":"React"}
data: {"content":" Hooks"}
data: {"content":" are"}
data: {"content":" functions"}
...
data: [DONE]
```

**Error (400 Bad Request)**:
```json
{
  "error": "Missing required fields"
}
```

**Error (404 Not Found)**:
```json
{
  "error": "Session not found"
}
```

---

### Get Messages
Retrieve all messages in a session.

```http
GET /chat/messages/:sessionId
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Max messages to return (default: 100) |
| `skip` | integer | Skip N messages for pagination (default: 0) |
| `sort` | string | Sort order: `asc` (default) or `desc` |

**Response (200 OK)**:
```json
{
  "messages": [
    {
      "id": "msg-001",
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "user",
      "content": "What are React Hooks?",
      "status": "completed",
      "evidence": [],
      "created_at": "2025-11-28T10:31:00Z"
    },
    {
      "id": "msg-002",
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "assistant",
      "content": "React Hooks are functions that let you use state and other React features...",
      "status": "completed",
      "evidence": [
        {
          "source": "React Documentation",
          "snippet": "Hooks are functions that let you 'hook into' React state...",
          "confidence": 0.95
        }
      ],
      "created_at": "2025-11-28T10:31:05Z"
    }
  ]
}
```

---

### Regenerate Response
Regenerate the last assistant response (cascade deletes subsequent messages).

```http
POST /chat/regenerate
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "What are React Hooks?",
  "userMessageId": "msg-001"
}
```

**Response (200 OK - Server-Sent Events)**:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"content":"React"}
data: {"content":" Hooks"}
...
data: [DONE]
```

**Behavior**:
- Deletes all messages after the specified `userMessageId`
- Generates new assistant response
- Useful for getting alternative answers or correcting conversation direction

---

### Delete Message
Delete a message and its associated response (cascade deletion).

```http
POST /chat/message/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "messageId": "msg-001"
}
```

**Response (200 OK)**:
```json
{
  "message": "Message deleted"
}
```

**Behavior**:
- If deleting a user message, also deletes the next assistant response
- Updates session message count
- If last message is deleted, entire session is deleted
- Invalidates all related caches

**Error (404 Not Found)**:
```json
{
  "error": "Message not found or not owned by this user"
}
```

---

## Admin Operations

### Get Cache Statistics
Retrieve backend cache statistics (LRU Cache).

```http
GET /admin/cache
Authorization: Bearer <token>
```

**Note**: Requires `is_admin: true`

**Response (200 OK)**:
```json
{
  "stats": {
    "size": 45,
    "maxSize": 100,
    "keys": [
      "sessions:507f1f77bcf86cd799439011",
      "messages:550e8400-e29b-41d4-a716-446655440000",
      "session:550e8400-e29b-41d4-a716-446655440000:507f1f77bcf86cd799439011"
    ]
  }
}
```

---

### Clear Cache
Clear all backend cache entries.

```http
DELETE /admin/cache
Authorization: Bearer <token>
```

**Note**: Requires `is_admin: true`

**Response (200 OK)**:
```json
{
  "message": "Cache cleared"
}
```

---

### Get Metrics
Retrieve system metrics and performance data.

```http
GET /admin/metrics
Authorization: Bearer <token>
```

**Note**: Requires `is_admin: true`

**Response (200 OK)**:
```json
{
  "metrics": {
    "totalRequests": 1523,
    "totalChats": 347,
    "totalMessages": 8392,
    "averageResponseTime": 245,
    "uptime": 86400000,
    "lastReset": "2025-11-28T00:00:00Z"
  }
}
```

---

### Get Logs
Retrieve system logs.

```http
GET /admin/logs
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Max logs to return (default: 100) |
| `level` | string | Filter by level: `info`, `warn`, `error` |

**Note**: Requires `is_admin: true`

**Response (200 OK)**:
```json
{
  "logs": [
    {
      "timestamp": "2025-11-28T14:30:00Z",
      "level": "info",
      "message": "Response generated in session 550e8400-e29b-41d4-a716-446655440000",
      "metadata": {}
    },
    {
      "timestamp": "2025-11-28T14:25:30Z",
      "level": "warn",
      "message": "Cache size approaching maximum",
      "metadata": {"size": 95, "maxSize": 100}
    }
  ]
}
```

---

### Clear Logs
Delete all system logs.

```http
DELETE /admin/logs
Authorization: Bearer <token>
```

**Note**: Requires `is_admin: true`

**Response (200 OK)**:
```json
{
  "message": "Logs cleared"
}
```

---

### Get System Metrics
Get detailed system health information.

```http
GET /admin/metrics
Authorization: Bearer <token>
```

**Note**: Requires `is_admin: true`

**Response (200 OK)**:
```json
{
  "metrics": {
    "totalRequests": 1523,
    "totalChats": 347,
    "totalMessages": 8392,
    "averageResponseTime": 245,
    "uptime": 86400000,
    "lastReset": "2025-11-28T00:00:00Z"
  }
}
```

---

### Reset Metrics
Reset all metrics counters.

```http
POST /admin/metrics/reset
Authorization: Bearer <token>
```

**Note**: Requires `is_admin: true`

**Response (200 OK)**:
```json
{
  "message": "Metrics reset successfully"
}
```

---

## Health Check

### System Health
Check if system is operational.

```http
GET /health
```

**Response (200 OK)**:
```json
{
  "status": "ok",
  "ollama": "connected",
  "timestamp": "2025-11-28T14:30:00Z"
}
```

**Response (503 Service Unavailable)**:
```json
{
  "status": "error",
  "ollama": "disconnected",
  "message": "Ollama service is not available"
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Missing/invalid parameters |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Ollama or database is down |

### Error Response Examples

**Missing Token**:
```json
{
  "error": "Authorization token required"
}
```

**Invalid Token**:
```json
{
  "error": "Invalid or expired token"
}
```

**Not Admin**:
```json
{
  "error": "Admin access required"
}
```

---

## Rate Limiting & Caching

### Request Headers

```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Response Headers

```http
Cache-Control: no-cache (for streaming endpoints)
Connection: keep-alive (for SSE)
Content-Type: application/json or text/event-stream
```

### Caching Strategy

**Server-Side LRU Cache** (Backend):
- Sessions: 30 seconds TTL
- Messages: 45 seconds TTL
- Documents: 60 seconds TTL
- Max capacity: 100 entries

**Client-Side IndexedDB** (Frontend):
- Persistent storage across sessions
- Cache-first loading strategy
- Automatic background refresh
- Expires after 5 minutes (configurable)

### Cache Invalidation

Cache is automatically cleared on:
- Message creation
- Message deletion
- Message update
- Session rename
- Session deletion

Manual cache clear:
```http
DELETE /admin/cache
Authorization: Bearer <token>
```

---

## Code Examples

### JavaScript/Node.js

```javascript
// Send a message
const response = await fetch('http://localhost:5000/api/chat/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionId: 'session-id',
    message: 'What is React?'
  })
})

// Stream the response
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const text = decoder.decode(value)
  const lines = text.split('\n')
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const json = JSON.parse(line.slice(6))
      console.log(json.content)
    }
  }
}
```

### Python

```python
import requests
import json

# Login
login_response = requests.post(
    'http://localhost:5000/api/auth/login',
    json={'username': 'user', 'password': 'pass'}
)
token = login_response.json()['token']

# Send message with streaming
response = requests.post(
    'http://localhost:5000/api/chat/send',
    headers={'Authorization': f'Bearer {token}'},
    json={'sessionId': 'session-id', 'message': 'What is React?'},
    stream=True
)

for line in response.iter_lines():
    if line.startswith(b'data: '):
        data = json.loads(line[6:])
        print(data['content'], end='', flush=True)
```

### cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'

# Send message
curl -X POST http://localhost:5000/api/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"id","message":"What is React?"}'
```

---

## WebSocket (Real-time Updates)

Currently, PocketLLM uses Server-Sent Events (SSE) for streaming responses.

**Future Enhancement**: WebSocket support for real-time bidirectional communication.

---

## Pagination

For endpoints that support pagination:

```http
GET /chat/sessions?limit=10&skip=0
Authorization: Bearer <token>
```

**Parameters**:
- `limit`: Number of items per page (default: 50, max: 100)
- `skip`: Number of items to skip (default: 0)

**Response includes pagination info**:
```json
{
  "data": [...],
  "pagination": {
    "total": 347,
    "limit": 10,
    "skip": 0,
    "pages": 35
  }
}
```

---

## Version Information

- **API Version**: 1.0
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **LLM**: Ollama
- **Last Updated**: 2025-11-28

---

## Support

For issues or questions:
1. Check the main README.md
2. Review error messages in logs
3. Check admin dashboard metrics
4. File an issue on GitHub

---
