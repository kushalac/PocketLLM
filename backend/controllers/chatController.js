const ChatService = require("../services/ChatService")
const LLMService = require("../services/LLMService")
const MetricsService = require("../services/MetricsService")
const LogService = require("../services/LogService")

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

    const startTime = Date.now()
    let fullResponse = ""

    try {
      for await (const chunk of LLMService.streamResponse(message)) {
        // Only write to the response if it is still writable
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
        }
        fullResponse += chunk
      }

      const responseTime = Date.now() - startTime
      MetricsService.recordResponseTime(responseTime)

      await ChatService.addMessage(sessionId, req.user.id, "assistant", fullResponse)

      if (!res.writableEnded) {
        res.write("data: [DONE]\n\n")
        res.end()
      }

      await LogService.log("info", `Message sent in session ${sessionId}`)
    } catch (err) {
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

module.exports = { startSession, getSessions, sendMessage, renameSession, deleteSession, exportSession }
