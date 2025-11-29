const Log = require("../models/Log")

class LogService {
  async log(level, message, metadata = null) {
    try {
      const entry = new Log({ level, message, metadata })
      await entry.save()
    } catch (err) {
      // If logging to DB fails, fallback to console to avoid crashing the app
      console.error("Failed to write log to MongoDB:", err)
    }
  }

  async getLogs(limit = 100) {
    return await Log.find().sort({ timestamp: -1 }).limit(limit).lean()
  }

  async clearLogs() {
    await Log.deleteMany({})
  }
}

module.exports = new LogService()
