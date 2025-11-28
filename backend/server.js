const express = require("express")
const cors = require("cors")
require("dotenv").config()

const { initDB } = require("./db/connection")
const LLMService = require("./services/LLMService")
const MetricsService = require("./services/MetricsService")
const authRoutes = require("./routes/auth")
const chatRoutes = require("./routes/chat")
const adminRoutes = require("./routes/admin")

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())

// Capture raw body for debugging JSON parse errors
app.use(express.json({
  verify: (req, _res, buf) => {
    try {
      req.rawBody = buf && buf.toString ? buf.toString() : ''
    } catch (e) {
      req.rawBody = ''
    }
  },
}))

// Track all API requests for metrics
app.use('/api', (req, res, next) => {
  MetricsService.recordRequest()
  next()
})

let ollamaHealthCache = { status: false, lastCheck: 0 }
const CACHE_DURATION = 30000 // 30 seconds

app.get("/api/health", async (req, res) => {
  try {
    const now = Date.now()
    if (now - ollamaHealthCache.lastCheck > CACHE_DURATION) {
      ollamaHealthCache.status = await LLMService.isHealthy()
      ollamaHealthCache.lastCheck = now
    }
    
    res.json({
      status: "ok",
      ollama: ollamaHealthCache.status ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    })
  }
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/admin", adminRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  // If body-parser produced a SyntaxError while parsing JSON, log the raw body to help debugging
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError || /Unexpected token|Expected property name/.test(err.message || ''))) {
    console.error('JSON parse error. Raw body:', req.rawBody)
    console.error(err.stack)
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }

  console.error(err.stack)
  res.status(err.status || 500).json({ error: err.message })
})

const startServer = async () => {
  try {
    await initDB()
    console.log("Database initialized successfully")

    const ollamaReady = await LLMService.isHealthy()
    if (ollamaReady) {
      console.log("Ollama LLM service is ready")
    } else {
      console.warn("Warning: Ollama LLM service not ready, will retry on requests")
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error("Failed to start server:", err)
    process.exit(1)
  }
}

startServer()
