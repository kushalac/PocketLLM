import apiClient from "./ApiService"
import AuthService from "./AuthService"
import IndexedDBCache from "./IndexedDBCache"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

class ChatSessionService {
  constructor() {
    this.sessionsCacheKey = "chat_sessions"
  }

  async startSession() {
    const res = await apiClient.post("/chat/start")
    const sessionId = res.data.sessionId
    
    // Refresh sessions cache
    this.getSessions(true)
    
    return sessionId
  }

  async getSessions(forceRefresh = false) {
    try {
      // Try to get from cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = await IndexedDBCache.getSessions()
        if (cached && cached.length > 0) {
          console.log(`Loaded ${cached.length} sessions from IndexedDB cache`)
          // Still fetch in background to update cache
          this._refreshSessionsInBackground()
          return cached
        }
      }

      // Fetch from API
      const res = await apiClient.get("/chat/sessions")
      const sessions = res.data.sessions || []
      
      // Normalize session objects
      const normalized = sessions.map((s) => ({
        ...s,
        id: s.id || s._id || s._id?._id || null,
        title: s.title || s.name || "New Chat",
        created_at: s.created_at || s.createdAt,
        updated_at: s.updated_at || s.updatedAt,
        message_count: s.message_count ?? s.messageCount ?? 0,
      }))

      // Save to cache
      await IndexedDBCache.saveSessions(normalized)
      
      return normalized
    } catch (error) {
      console.error("Failed to get sessions:", error)
      
      // Fallback to cache on error
      const cached = await IndexedDBCache.getSessions()
      if (cached && cached.length > 0) {
        console.log("Using cached sessions due to API error")
        return cached
      }
      
      throw error
    }
  }

  async _refreshSessionsInBackground() {
    try {
      const res = await apiClient.get("/chat/sessions")
      const sessions = res.data.sessions || []
      
      const normalized = sessions.map((s) => ({
        ...s,
        id: s.id || s._id || s._id?._id || null,
        title: s.title || s.name || "New Chat",
        created_at: s.created_at || s.createdAt,
        updated_at: s.updated_at || s.updatedAt,
        message_count: s.message_count ?? s.messageCount ?? 0,
      }))

      await IndexedDBCache.saveSessions(normalized)
      console.log("Background refresh: sessions cache updated")
    } catch (error) {
      console.error("Background refresh failed:", error)
    }
  }

  // Use fetch for streaming responses so the caller can read response.body.getReader()
  async sendMessage(sessionId, message, signal) {
    const token = AuthService.getToken()
    const res = await fetch(`${API_URL}/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sessionId, message }),
      signal,
    })

    return res
  }

  async renameSession(sessionId, title) {
    const res = await apiClient.patch(`/chat/rename/${sessionId}`, { title })
    
    // Update cache
    await this.getSessions(true)
    
    return res
  }

  async deleteSession(sessionId) {
    const res = await apiClient.delete(`/chat/session/${sessionId}`)
    
    // Remove from cache
    await IndexedDBCache.deleteSession(sessionId)
    
    return res
  }

  exportSession(sessionId) {
    return apiClient.get(`/chat/export/${sessionId}`)
  }

  async downloadSession(sessionId) {
    const token = AuthService.getToken()
    const response = await fetch(`${API_URL}/chat/export/${sessionId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to export session")
    }

    const disposition = response.headers.get("Content-Disposition") || ""
    const match = disposition.match(/filename="?([^";]+)"?/)
    const filename = match ? match[1] : `chat-${sessionId}.json`
    const blob = await response.blob()
    return { blob, filename }
  }

  async getMessages(sessionId, forceRefresh = false) {
    try {
      // Try to get from cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = await IndexedDBCache.getMessages(sessionId)
        if (cached && cached.length > 0) {
          console.log(`Loaded ${cached.length} messages from IndexedDB cache for session ${sessionId}`)
          // Still fetch in background to update cache
          this._refreshMessagesInBackground(sessionId)
          return cached
        }
      }

      // Fetch from API
      const res = await apiClient.get(`/chat/export/${sessionId}`)
      const messages = res.data.messages || []
      
      // Save to cache
      await IndexedDBCache.saveMessages(sessionId, messages)
      
      return messages
    } catch (error) {
      console.error("Failed to get messages:", error)
      
      // Fallback to cache on error
      const cached = await IndexedDBCache.getMessages(sessionId)
      if (cached && cached.length > 0) {
        console.log("Using cached messages due to API error")
        return cached
      }
      
      throw error
    }
  }

  async _refreshMessagesInBackground(sessionId) {
    try {
      const res = await apiClient.get(`/chat/export/${sessionId}`)
      const messages = res.data.messages || []
      
      await IndexedDBCache.saveMessages(sessionId, messages)
      console.log(`Background refresh: messages cache updated for session ${sessionId}`)
    } catch (error) {
      console.error("Background refresh failed:", error)
    }
  }

  async clearCache() {
    await IndexedDBCache.clearAll()
  }

  async getCacheStats() {
    return await IndexedDBCache.getStats()
  }
}

export default new ChatSessionService()
