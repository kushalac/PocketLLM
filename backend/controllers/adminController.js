const LogService = require("../services/LogService")
const MetricsService = require("../services/MetricsService")
const CacheService = require("../services/CacheService")

const getLogs = async (req, res) => {
  try {
    const limit = req.query.limit || 100
    const logs = await LogService.getLogs(limit)
    res.json({ logs })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getMetrics = async (req, res) => {
  try {
    const metrics = await MetricsService.getMetrics()
    res.json({ metrics })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getCacheStats = async (req, res) => {
  try {
    const stats = CacheService.stats()
    res.json({ stats })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const clearCache = async (req, res) => {
  try {
    CacheService.clear()
    res.json({ message: "Cache cleared" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const clearLogs = async (req, res) => {
  try {
    await LogService.clearLogs()
    res.json({ message: "Logs cleared" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const resetMetrics = async (req, res) => {
  try {
    await MetricsService.reset()
    res.json({ message: "Metrics reset" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  getLogs,
  getMetrics,
  getCacheStats,
  clearCache,
  clearLogs,
  resetMetrics,
}
