import apiClient from "./ApiService"
import AuthService from "./AuthService"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

class ChatSessionService {
  startSession() {
    return apiClient.post("/chat/start").then((res) => {
      return res.data.sessionId
    })
  }

  getSessions() {
    return apiClient.get("/chat/sessions").then((res) => {
      const sessions = res.data.sessions || []
      // Normalize session objects to ensure frontend uses `id` consistently
      return sessions.map((s) => ({
        ...s,
        id: s.id || s._id || s._id?._id || null,
        title: s.title || s.name || "New Chat",
        created_at: s.created_at || s.createdAt,
        updated_at: s.updated_at || s.updatedAt,
        message_count: s.message_count ?? s.messageCount ?? 0,
      }))
    })
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

  renameSession(sessionId, title) {
    return apiClient.patch(`/chat/rename/${sessionId}`, { title })
  }

  deleteSession(sessionId) {
    return apiClient.delete(`/chat/session/${sessionId}`)
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

  async getMessages(sessionId) {
    // Reuse the export endpoint which returns session + messages
    const res = await apiClient.get(`/chat/export/${sessionId}`)
    // messages are returned under res.data.messages
    return res.data.messages || []
  }
}

export default new ChatSessionService()
