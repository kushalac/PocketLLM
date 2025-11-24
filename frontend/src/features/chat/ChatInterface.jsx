"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AuthService from "../../core/AuthService"
import ChatSessionService from "../../core/ChatSessionService"
import ChatHeader from "./ChatHeader"
import ChatSidebar from "./ChatSidebar"
import MessageList from "./MessageList"
import PromptInput from "./PromptInput"

export default function ChatInterface() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    loadSessions()
  }, [])

  // Load messages whenever the active session changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeSessionId) {
        setMessages([])
        return
      }

      try {
        const msgs = await ChatSessionService.getMessages(activeSessionId)
        // Normalize messages to { id, role, content }
        const formatted = (msgs || []).map((m) => ({
          id: m._id || m.id || Date.now(),
          role: m.role,
          content: m.content,
        }))
        setMessages(formatted)
      } catch (err) {
        setError('Failed to load messages')
      }
    }

    fetchMessages()
  }, [activeSessionId])

  const loadSessions = async () => {
    try {
      const data = await ChatSessionService.getSessions()
      setSessions(data)
      // Only set a default active session if none is already selected.
      setActiveSessionId((curr) => (curr ? curr : data.length > 0 ? data[0].id : null))
    } catch (err) {
      setError("Failed to load sessions")
    }
  }

  const handleNewChat = async () => {
    try {
      const sessionId = await ChatSessionService.startSession()
      setActiveSessionId(sessionId)
      setMessages([])
      await loadSessions()
    } catch (err) {
      setError("Failed to create new chat")
    }
  }

  const handleSendMessage = async (message) => {
    if (!activeSessionId) return

    const userMessage = { role: "user", content: message, id: Date.now() }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    setError("")

    try {
      const response = await ChatSessionService.sendMessage(activeSessionId, message)

      let assistantMessage = ""
      // For fetch responses the stream reader is on `response.body`.
      const reader = response?.body?.getReader?.()

      if (reader) {
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                assistantMessage += parsed.content || ""
                setMessages((prev) => {
                  const updated = [...prev]
                  if (updated[updated.length - 1]?.role === "assistant") {
                    updated[updated.length - 1].content = assistantMessage
                  } else {
                    updated.push({ role: "assistant", content: assistantMessage, id: Date.now() })
                  }
                  return updated
                })
              } catch (e) {
                // Continue on parse error
              }
            }
          }
        }
      }

      await loadSessions()
    } catch (err) {
      setError("Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      await ChatSessionService.renameSession(sessionId, newTitle)
      await loadSessions()
    } catch (err) {
      setError("Failed to rename session")
    }
  }

  const handleDeleteSession = async (sessionId) => {
    try {
      await ChatSessionService.deleteSession(sessionId)
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setMessages([])
      }
      await loadSessions()
    } catch (err) {
      setError("Failed to delete session")
    }
  }

  const handleLogout = () => {
    AuthService.logout()
    navigate("/login")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col">
        <ChatHeader onLogout={handleLogout} />

        <div className="flex-1 overflow-hidden">
          {activeSessionId ? (
            <div className="h-full flex flex-col">
              <MessageList messages={messages} loading={loading} />
              <PromptInput onSubmit={handleSendMessage} disabled={loading} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-4">No chat selected</p>
                <button
                  onClick={handleNewChat}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border-t border-red-200 p-4 text-red-700">{error}</div>}
      </div>
    </div>
  )
}
