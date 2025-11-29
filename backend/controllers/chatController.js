const ChatService = require("../services/ChatService")
const LLMService = require("../services/LLMService")
const MetricsService = require("../services/MetricsService")
const LogService = require("../services/LogService")
const DocumentService = require("../services/DocumentService")
const UserPreferencesService = require("../services/UserPreferencesService")
const AdminSettings = require("../models/AdminSettings")

const buildPromptFromHistory = (messages = []) => {
  if (!messages.length) return null
  const transcript = messages
    .map((msg) => {
      const speaker = msg.role === "user" ? "User" : "Assistant"
      return `${speaker}: ${msg.content}`
    })
    .join("\n")
  return `${transcript}\nAssistant:`
}

const startSession = async (req, res) => {
  try {
    const sessionId = await ChatService.createSession(req.user.id)
    MetricsService.recordChat()
    res.json({ sessionId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getSessions = async (req, res) => {
  try {
    const sessions = await ChatService.getSessions(req.user.id)
    res.json({ sessions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body

    if (!sessionId || !message) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const session = await ChatService.getSession(sessionId, req.user.id)
    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    await ChatService.addMessage(sessionId, req.user.id, "user", message)
    MetricsService.recordMessage()

    // Stream response
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")

    // Fetch admin settings and user preferences to get model settings
    const adminSettings = await AdminSettings.findOne().lean()
    const userSettings = await UserPreferencesService.getUserModelSettings(req.user.id, adminSettings)
    const contextWindowSize = userSettings.contextWindowSize
    const maxResponseLength = userSettings.maxResponseLength

    const startTime = Date.now()
    let fullResponse = ""
    const abortController = new AbortController()
    const handleAbort = () => abortController.abort()
    req.on("close", handleAbort)
    let streamCancelled = false
    let shouldPersistAssistant = false

    let conversationPrompt = await ChatService.getConversationContext(sessionId, req.user.id, 8)
    conversationPrompt = buildPromptFromHistory(conversationPrompt) || `User: ${message}\nAssistant:`

    try {
      for await (const chunk of LLMService.streamResponse(conversationPrompt, { signal: abortController.signal, contextWindowSize, maxResponseLength })) {
        // Only write to the response if it is still writable
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
        }
        fullResponse += chunk
      }

      const responseTime = Date.now() - startTime
      MetricsService.recordResponseTime(responseTime)
      shouldPersistAssistant = true
    } catch (err) {
      let errorMessage = null
      if (abortController.signal.aborted) {
        streamCancelled = true
        shouldPersistAssistant = Boolean(fullResponse)
      } else {
        console.error("Streaming error:", err)
        errorMessage = err.message
        if (!res.writableEnded) {
          try {
            res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
            res.end()
          } catch (writeErr) {
            console.error("Error writing error response (response may already be closed):", writeErr)
          }
        }
      }
      
      // Persist error message to database
      if (errorMessage) {
        await ChatService.addMessage(sessionId, req.user.id, "assistant", errorMessage, {
          status: "error",
          evidence: [],
        })
      }
    }
    req.off("close", handleAbort)

    if (fullResponse && shouldPersistAssistant) {
      let evidence = await DocumentService.searchDocuments(req.user.id, message)
      if (!evidence.length) {
        evidence = await ChatService.getRecentUserSnippets(sessionId, req.user.id)
      }
      await ChatService.addMessage(sessionId, req.user.id, "assistant", fullResponse, {
        evidence,
        status: streamCancelled ? "aborted" : "completed",
        ...(streamCancelled ? { meta: { stoppedByUser: true } } : {}),
      })
      await LogService.log("info", `Message sent in session ${sessionId}`)
    } else if (streamCancelled && !fullResponse) {
      await ChatService.addMessage(
        sessionId,
        req.user.id,
        "assistant",
        "Response stopped before the model generated an answer.",
        {
          status: "aborted",
          meta: { stoppedByUser: true, emptyResponse: true },
        },
      )
    }

    if (!res.writableEnded && !streamCancelled) {
      res.write("data: [DONE]\n\n")
      res.end()
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const renameSession = async (req, res) => {
  try {
    const { sessionId } = req.params
    const { title } = req.body

    const updated = await ChatService.renameSession(sessionId, req.user.id, title)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params
    await ChatService.deleteSession(sessionId, req.user.id)
    res.json({ message: "Session deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const regenerateResponse = async (req, res) => {
  try {
    const { sessionId, message, userMessageId } = req.body

    if (!sessionId || !message) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const session = await ChatService.getSession(sessionId, req.user.id)
    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    // Delete all messages after the user message (cascade delete)
    if (userMessageId) {
      const deletedCount = await ChatService.deleteMessagesAfter(sessionId, userMessageId, req.user.id)
      console.log(`Cascade deleted ${deletedCount} messages after regenerate point`)
    }

    // Do NOT add a new user message - regenerate for existing message
    MetricsService.recordMessage()

    // Stream response
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")

    // Fetch admin settings and user preferences to get model settings
    const adminSettings = await AdminSettings.findOne().lean()
    const userSettings = await UserPreferencesService.getUserModelSettings(req.user.id, adminSettings)
    const responseTimeout = userSettings.responseTimeout * 1000 // Convert seconds to milliseconds
    const contextWindowSize = userSettings.contextWindowSize
    const maxResponseLength = userSettings.maxResponseLength

    const startTime = Date.now()
    let fullResponse = ""
    const abortController = new AbortController()
    const handleAbort = () => abortController.abort()
    req.on("close", handleAbort)
    let streamCancelled = false
    let shouldPersistAssistant = false

    let conversationPrompt = await ChatService.getConversationContext(sessionId, req.user.id, 8)
    conversationPrompt = buildPromptFromHistory(conversationPrompt) || `User: ${message}\nAssistant:`

    try {
      for await (const chunk of LLMService.streamResponse(conversationPrompt, { signal: abortController.signal, timeout: responseTimeout, contextWindowSize, maxResponseLength })) {
        // Only write to the response if it is still writable
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
        }
        fullResponse += chunk
      }

      const responseTime = Date.now() - startTime
      MetricsService.recordResponseTime(responseTime)
      shouldPersistAssistant = true
    } catch (err) {
      if (abortController.signal.aborted) {
        streamCancelled = true
        shouldPersistAssistant = Boolean(fullResponse)
      } else {
        console.error("Streaming error:", err)
        if (!res.writableEnded) {
          try {
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
            res.end()
          } catch (writeErr) {
            console.error("Error writing error response (response may already be closed):", writeErr)
          }
        }
      }
    }
    req.off("close", handleAbort)

    if (fullResponse && shouldPersistAssistant) {
      let evidence = await DocumentService.searchDocuments(req.user.id, message)
      if (!evidence.length) {
        evidence = await ChatService.getRecentUserSnippets(sessionId, req.user.id)
      }
      await ChatService.addMessage(sessionId, req.user.id, "assistant", fullResponse, {
        evidence,
        status: streamCancelled ? "aborted" : "completed",
        ...(streamCancelled ? { meta: { stoppedByUser: true } } : {}),
      })
      await LogService.log("info", `Response regenerated in session ${sessionId}`)
    } else if (streamCancelled && !fullResponse) {
      await ChatService.addMessage(
        sessionId,
        req.user.id,
        "assistant",
        "Response stopped before the model generated an answer.",
        {
          status: "aborted",
          meta: { stoppedByUser: true, emptyResponse: true },
        },
      )
    }

    if (!res.writableEnded && !streamCancelled) {
      res.write("data: [DONE]\n\n")
      res.end()
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const exportSession = async (req, res) => {
  try {
    const { sessionId } = req.params
    const data = await ChatService.exportSession(sessionId, req.user.id)

    res.setHeader("Content-Type", "application/json")
    res.setHeader("Content-Disposition", `attachment; filename="chat-${sessionId}.json"`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const uploadDocument = async (req, res) => {
  try {
    const { title, content, tags } = req.body
    const doc = await DocumentService.createDocument(req.user.id, { title, content, tags })
    MetricsService.recordDocumentUpload()
    res.status(201).json({ document: doc })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const listDocuments = async (req, res) => {
  try {
    const documents = await DocumentService.listDocuments(req.user.id)
    res.json({ documents })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params
    await DocumentService.deleteDocument(req.user.id, documentId)
    res.json({ message: "Document deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const deleteMessage = async (req, res) => {
  try {
    const { sessionId, messageId } = req.body

    if (!sessionId || !messageId) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    console.log("Delete message request:", { sessionId, messageId, userId: req.user.id })
    
    await ChatService.deleteMessage(sessionId, messageId, req.user.id)
    console.log("Message deleted successfully")
    res.json({ message: "Message deleted" })
  } catch (err) {
    console.error("Error deleting message:", err.message)
    res.status(500).json({ error: err.message })
  }
}

const updateMessage = async (req, res) => {
  try {
    const { sessionId, messageId, content, status } = req.body

    if (!sessionId || !messageId) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const updates = {}
    if (content !== undefined) {
      updates.content = content
    }
    if (status !== undefined) {
      updates.status = status
    }

    await ChatService.updateMessage(sessionId, messageId, req.user.id, updates)
    res.json({ message: "Message updated" })
  } catch (err) {
    console.error("Error updating message:", err.message)
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  startSession,
  getSessions,
  sendMessage,
  regenerateResponse,
  renameSession,
  deleteSession,
  deleteMessage,
  updateMessage,
  exportSession,
  uploadDocument,
  listDocuments,
  deleteDocument,
}
