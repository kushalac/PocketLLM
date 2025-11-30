"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import axios from "axios"
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
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Restore from localStorage or default to true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatSidebarOpen')
      return saved ? JSON.parse(saved) : true
    }
    return true
  })
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSessionRef = useRef(null)
  const streamingSessionRef = useRef(null)
  const messagesCacheRef = useRef({})
  const isCreatingSessionRef = useRef(false)

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
    async (sessionId, forceRefresh = false) => {
      if (!sessionId) {
        setMessages([])
        return
      }

      try {
        // Load messages (will use cache automatically)
        const msgs = await ChatSessionService.getMessages(sessionId, forceRefresh)
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
        console.error("Error loading messages:", err)
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
    }
    // Don't clear messages - just load asynchronously, keep cached messages visible
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

  const loadSessions = async (forceRefresh = false) => {
    try {
      // Load sessions (will use cache automatically)
      const data = await ChatSessionService.getSessions(forceRefresh)
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
      console.error("Error loading sessions:", err)
    }
  }

  const handleNewChat = async () => {
    // Use ref for immediate check to prevent race conditions
    if (isCreatingSessionRef.current) {
      console.log("Already creating session")
      return
    }
    
    try {
      isCreatingSessionRef.current = true
      setIsCreatingSession(true)
      setError("")
      
      console.log("Starting new session")
      const sessionId = await ChatSessionService.startSession()
      console.log("Session created:", sessionId)
      
      setMessages([])
      await loadSessions(true)
      setActiveSession(sessionId)
      console.log("New session creation complete")
    } catch (err) {
      console.error("Failed to create new chat:", err)
      setError("Failed to create new chat")
    } finally {
      isCreatingSessionRef.current = false
      setIsCreatingSession(false)
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
                
                // Check for error in response
                if (parsed.error) {
                  assistantMessage = parsed.error
                  updateMessagesForSession(currentSessionId, (prev) => {
                    const updated = [...prev]
                    const last = updated[updated.length - 1]
                    if (last?.role === "assistant" && last.status === "streaming") {
                      updated[updated.length - 1] = { ...last, content: assistantMessage, status: "error" }
                    } else {
                      updated.push({
                        role: "assistant",
                        content: assistantMessage,
                        id: Date.now(),
                        status: "error",
                        evidence: [],
                      })
                    }
                    return updated
                  })
                  break
                }
                
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
      loadSessions(true)
      // Force refresh to get latest messages including error messages from DB
      await fetchMessages(currentSessionId, true)
      setIsStreaming(false)
      setStreamController(null)
      streamingSessionRef.current = null
    }
  }

  const handleStopStreaming = async () => {
    if (streamController) {
      streamController.abort()
    }
    
    const currentSessionId = activeSessionRef.current
    const allMessages = messagesCacheRef.current[currentSessionId] || messages
    const lastMsg = allMessages[allMessages.length - 1]
    
    // Mark as aborted in React state
    updateMessagesForSession(currentSessionId, (prev) => {
      const updated = [...prev]
      const msg = updated[updated.length - 1]
      if (msg?.role === "assistant" && msg.status === "streaming") {
        updated[updated.length - 1] = { ...msg, status: "aborted" }
      }
      return updated
    })
    
    // Save the partial response to the database
    if (lastMsg?.id && lastMsg?.role === "assistant" && lastMsg?.status === "streaming") {
      try {
        await axios.post(
          "/api/chat/message/update",
          {
            sessionId: currentSessionId,
            messageId: lastMsg.id,
            content: lastMsg.content,
            status: "aborted",
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
        )
      } catch (err) {
        console.error("Failed to save partial response:", err.message)
      }
    }
    
    setIsStreaming(false)
    setStreamController(null)
    streamingSessionRef.current = null
  }

  const handleRegenerateResponse = async (messageIndex) => {
    if (isStreaming || !activeSessionRef.current) return
    
    const currentSessionId = activeSessionRef.current
    const allMessages = messagesCacheRef.current[currentSessionId] || messages
    const assistantMessage = allMessages[messageIndex]
    
    if (!assistantMessage || assistantMessage.role !== "assistant") return
    
    // Find the user message that triggered this response
    let userMessageIndex = messageIndex - 1
    while (userMessageIndex >= 0 && allMessages[userMessageIndex]?.role !== "user") {
      userMessageIndex--
    }
    
    if (userMessageIndex < 0) return
    
    const userMessage = allMessages[userMessageIndex]
    const userContent = userMessage.content
    const assistantMessageId = assistantMessage.id
    
    // Delete old assistant response from DB
    try {
      await ChatSessionService.deleteMessage(currentSessionId, assistantMessageId)
    } catch (err) {
      console.error("Error deleting old response:", err)
    }
    
    // Remove old response from UI only (keep user message)
    updateMessagesForSession(currentSessionId, (prev) => 
      prev.slice(0, messageIndex)
    )
    
    // Regenerate using the dedicated regenerate endpoint (doesn't add new user message)
    setIsStreaming(true)
    setError("")
    
    const abortController = new AbortController()
    setStreamController(abortController)
    streamingSessionRef.current = currentSessionId
    
    try {
      const response = await ChatSessionService.regenerateResponse(
        currentSessionId, 
        userContent, 
        abortController.signal,
        userMessage.id  // Pass user message ID for cascade deletion
      )
      
      let assistantResponseText = ""
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
                
                // Check for error in response
                if (parsed.error) {
                  assistantResponseText = parsed.error
                  updateMessagesForSession(currentSessionId, (prev) => {
                    const updated = [...prev]
                    const last = updated[updated.length - 1]
                    if (last?.role === "assistant" && last.status === "streaming") {
                      updated[updated.length - 1] = { ...last, content: assistantResponseText, status: "error" }
                    } else {
                      updated.push({
                        role: "assistant",
                        content: assistantResponseText,
                        id: Date.now(),
                        status: "error",
                        evidence: [],
                      })
                    }
                    return updated
                  })
                  break
                }
                
                assistantResponseText += parsed.content || ""
                if (streamingSessionRef.current !== currentSessionId) continue
                
                updateMessagesForSession(currentSessionId, (prev) => {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last?.role === "assistant" && last.status === "streaming") {
                    updated[updated.length - 1] = { ...last, content: assistantResponseText }
                  } else {
                    updated.push({
                      role: "assistant",
                      content: assistantResponseText,
                      id: Date.now(),
                      status: "streaming",
                      evidence: [],
                    })
                  }
                  return updated
                })
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("")
      } else {
        setError("Failed to regenerate response")
      }
    } finally {
      await loadSessions(true)
      // Force refresh to get latest messages including error messages from DB
      await fetchMessages(currentSessionId, true)
      setIsStreaming(false)
      setStreamController(null)
      streamingSessionRef.current = null
    }
  }

  const handleDeleteMessage = async (messageIndex) => {
    if (!activeSessionRef.current) return
    
    const currentSessionId = activeSessionRef.current
    const allMessages = messagesCacheRef.current[currentSessionId] || messages
    const messageToDelete = allMessages[messageIndex]
    
    if (!messageToDelete?.id) return
    
    // Only delete user messages
    if (messageToDelete.role !== "user") return
    
    try {
      console.log("Deleting user message:", messageToDelete.id, "and associated assistant response if exists")
      // Check how many messages to remove from UI
      let indicesToRemove = [messageIndex]
      if (messageIndex + 1 < allMessages.length && allMessages[messageIndex + 1]?.role === "assistant") {
        indicesToRemove.push(messageIndex + 1)
      }
      
      // Remove from local state FIRST (immediate UI feedback)
      updateMessagesForSession(currentSessionId, (prev) => 
        prev.filter((_, idx) => !indicesToRemove.includes(idx))
      )
      
      // Delete user message from DB - backend will also delete associated assistant response
      const deleteRes = await ChatSessionService.deleteMessage(currentSessionId, messageToDelete.id)
      console.log("Message pair deleted successfully")
      
      // Refresh sessions list
      await loadSessions(true)
      setError("") // Clear error on success
    } catch (err) {
      console.error("Failed to delete message:", err)
      setError("Failed to delete message: " + err.message)
      // Refetch to restore UI if deletion failed
      await fetchMessages(currentSessionId, true)
    }
  }

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      await ChatSessionService.renameSession(sessionId, newTitle)
      await loadSessions(true)
    } catch (err) {
      setError("Failed to rename session")
    }
  }

  const handleDeleteSession = async (sessionId) => {
    try {
      await ChatSessionService.deleteSession(sessionId)
      
      // Clear from local cache
      delete messagesCacheRef.current[sessionId]
      
      if (activeSessionId === sessionId) {
        setActiveSession(null)
        setMessages([])
      }
      await loadSessions(true)
    } catch (err) {
      setError("Failed to delete session")
    }
  }

  const handleLogout = async () => {
    await AuthService.logout()
    navigate("/login")
  }

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => {
      const newState = !prev
      localStorage.setItem('chatSidebarOpen', JSON.stringify(newState))
      return newState
    })
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
        isCreatingSession={isCreatingSession}
        isOpen={sidebarOpen}
      />

      <div className="flex-1 flex flex-col">
        <ChatHeader onLogout={handleLogout} onOpenDocs={() => setShowDocs(true)} onToggleSidebar={handleToggleSidebar} />

        <div className="flex-1 overflow-hidden flex flex-col">
          {activeSessionId ? (
            <div className="h-full flex flex-col">
              <MessageList messages={messages} loading={isStreaming} onRegenerate={handleRegenerateResponse} onDeleteMessage={handleDeleteMessage} />
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

