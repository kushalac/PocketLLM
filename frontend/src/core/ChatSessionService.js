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
      }))
    })
  }

  // Use fetch for streaming responses so the caller can read response.body.getReader()
  async sendMessage(sessionId, message) {
    const token = AuthService.getToken()
    const res = await fetch(`${API_URL}/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sessionId, message }),
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

  async getMessages(sessionId) {
    // Reuse the export endpoint which returns session + messages
    const res = await apiClient.get(`/chat/export/${sessionId}`)
    // messages are returned under res.data.messages
    return res.data.messages || []
  }
}

export default new ChatSessionService()
