"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import AuthService from "../../core/AuthService"
import ChatSessionService from "../../core/ChatSessionService"
import ChatHeader from "./ChatHeader"
import ChatSidebar from "./ChatSidebar"
import MessageList from "./MessageList"
import PromptInput from "./PromptInput"
import DocsPanel from "./DocsPanel"

export default function ChatInterface() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState("")
  const [showDocs, setShowDocs] = useState(false)
  const [streamController, setStreamController] = useState(null)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSessionRef = useRef(null)
  const streamingSessionRef = useRef(null)
  const messagesCacheRef = useRef({})

  const updateMessagesForSession = useCallback((sessionId, updater) => {
    if (!sessionId) return
    const prevMessages = messagesCacheRef.current[sessionId] || []
    const nextMessages = typeof updater === "function" ? updater(prevMessages) : updater
    messagesCacheRef.current[sessionId] = nextMessages

    if (activeSessionRef.current === sessionId) {
      setMessages(nextMessages)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    const requestedSession = searchParams.get("session")
    if (requestedSession && requestedSession !== activeSessionRef.current) {
      setActiveSession(requestedSession)
      return
    }

    if (!requestedSession && !activeSessionRef.current && sessions.length > 0) {
      setActiveSession(sessions[0].id)
    }
  }, [searchParams, sessions])

  const fetchMessages = useCallback(
    async (sessionId) => {
      if (!sessionId) {
        setMessages([])
        return
      }

      try {
        const msgs = await ChatSessionService.getMessages(sessionId)
        const formatted = (msgs || []).map((m) => ({
          id: m._id || m.id || Date.now(),
          role: m.role,
          content: m.content,
          evidence: m.evidence || [],
          status: m.status || "completed",
          meta: m.meta || {},
        }))
        updateMessagesForSession(sessionId, formatted)
      } catch (err) {
        setError("Failed to load messages")
      }
    },
    [updateMessagesForSession],
  )

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([])
      return
    }
    const cached = messagesCacheRef.current[activeSessionId]
    if (cached) {
      setMessages(cached)
    } else {
      setMessages([])
    }
    fetchMessages(activeSessionId)
  }, [activeSessionId, fetchMessages])

  const setActiveSession = (sessionId) => {
    setActiveSessionId(sessionId)
    activeSessionRef.current = sessionId
    if (sessionId) {
      setSearchParams({ session: sessionId })
    } else {
      setSearchParams({})
    }
  }

  const loadSessions = async () => {
    try {
      const data = await ChatSessionService.getSessions()
      setSessions(data)
      const requestedSession = searchParams.get("session")
      const isRequestedValid = requestedSession && data.some((s) => s.id === requestedSession)
      const current = activeSessionRef.current
      const isCurrentValid = current && data.some((s) => s.id === current)

      let nextSessionId = null
      if (isCurrentValid) {
        nextSessionId = current
      } else if (isRequestedValid) {
        nextSessionId = requestedSession
      }

      if (!nextSessionId && data.length > 0) {
        nextSessionId = data[0].id
      }

      if (nextSessionId !== activeSessionRef.current) {
        setActiveSession(nextSessionId)
      } else if (!nextSessionId) {
        setActiveSession(null)
      }
    } catch (err) {
      setError("Failed to load sessions")
    }
  }

  const handleNewChat = async () => {
    try {
      const sessionId = await ChatSessionService.startSession()
      setActiveSession(sessionId)
      setMessages([])
      await loadSessions()
    } catch (err) {
      setError("Failed to create new chat")
    }
  }

  const handleSendMessage = async (message) => {
    if (!activeSessionId) return

    const currentSessionId = activeSessionId
    const userMessage = { role: "user", content: message, id: Date.now(), status: "completed", evidence: [] }
    updateMessagesForSession(currentSessionId, (prev) => [...prev, userMessage])
    setIsStreaming(true)
    setError("")

    if (streamController) {
      streamController.abort()
    }

    const abortController = new AbortController()
    setStreamController(abortController)
    streamingSessionRef.current = currentSessionId

    try {
      const response = await ChatSessionService.sendMessage(currentSessionId, message, abortController.signal)

      let assistantMessage = ""
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
                if (streamingSessionRef.current !== currentSessionId) {
                  continue
                }
                updateMessagesForSession(currentSessionId, (prev) => {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last?.role === "assistant" && last.status === "streaming") {
                    updated[updated.length - 1] = { ...last, content: assistantMessage }
                  } else {
                    updated.push({
                      role: "assistant",
                      content: assistantMessage,
                      id: Date.now(),
                      status: "streaming",
                      evidence: [],
                    })
                  }
                  return updated
                })
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("")
      } else {
        setError("Failed to send message")
      }
    } finally {
      loadSessions()
      fetchMessages(currentSessionId)
      setIsStreaming(false)
      setStreamController(null)
      streamingSessionRef.current = null
    }
  }

  const handleStopStreaming = () => {
    if (streamController) {
      streamController.abort()
    }
    streamingSessionRef.current = null
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
        setActiveSession(null)
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
        onSelectSession={setActiveSession}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col">
        <ChatHeader onLogout={handleLogout} onOpenDocs={() => setShowDocs(true)} />

        <div className="flex-1 overflow-hidden">
          {activeSessionId ? (
            <div className="h-full flex flex-col">
              <MessageList messages={messages} loading={isStreaming} />
              <PromptInput onSubmit={handleSendMessage} disabled={isStreaming} isStreaming={isStreaming} onStop={handleStopStreaming} />
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
      <DocsPanel open={showDocs} onClose={() => setShowDocs(false)} />
    </div>
  )
}

