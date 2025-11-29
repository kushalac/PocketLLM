const LogService = require("../services/LogService")
const MetricsService = require("../services/MetricsService")
const CacheService = require("../services/CacheService")
const AdminSettings = require("../models/AdminSettings")

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

const updateModelSettings = async (req, res) => {
  try {
    const {
      contextWindowSize,
      maxResponseLength,
    } = req.body

    // Validate inputs
    if (contextWindowSize && (contextWindowSize < 1 || contextWindowSize > 20)) {
      return res.status(400).json({ error: "Context window size must be between 1 and 20" })
    }
    if (maxResponseLength && (maxResponseLength < 500 || maxResponseLength > 8000)) {
      return res.status(400).json({ error: "Max response length must be between 500 and 8000 tokens" })
    }

    // Get current settings for change tracking
    const oldSettings = await AdminSettings.findOne({ setting_type: "model_settings" })
    const oldValues = oldSettings ? oldSettings.toObject() : {}

    // Build update object with only provided fields
    const updates = {}
    if (contextWindowSize !== undefined) updates.contextWindowSize = contextWindowSize
    if (maxResponseLength !== undefined) updates.maxResponseLength = maxResponseLength

    // Save to database (upsert - create if doesn't exist)
    const settings = await AdminSettings.findOneAndUpdate(
      { setting_type: "model_settings" },
      { $set: updates },
      { upsert: true, new: true }
    )

    // Keep global cache in sync for performance
    global.modelSettings = settings.toObject()
    delete global.modelSettings._id
    delete global.modelSettings.__v
    delete global.modelSettings.setting_type

    // Log the change with before/after values
    const changeLog = {}
    for (const [key, newVal] of Object.entries(updates)) {
      changeLog[key] = {
        old: oldValues[key],
        new: newVal,
      }
    }

    await LogService.log("MODEL_SETTINGS_UPDATED", "Admin updated global model settings", {
      changes: changeLog,
      updatedBy: req.user.id,
      settingsSnapshot: global.modelSettings,
    })

    console.log(`[ADMIN] Model settings updated by user ${req.user.id}:`, changeLog)

    res.json({
      message: "Model settings updated successfully and applied to all users",
      settings: global.modelSettings,
      changes: changeLog,
    })
  } catch (err) {
    console.error("[ERROR] Failed to update model settings:", err)
    res.status(500).json({ error: err.message })
  }
}

const getModelSettings = async (req, res) => {
  try {
    // Fetch from database (primary source of truth)
    let settings = await AdminSettings.findOne({ setting_type: "model_settings" })

    // If not found in DB, use in-memory cache as fallback
    if (!settings) {
      console.warn("[WARN] No model settings in DB, using memory cache")
      settings = global.modelSettings || {
        contextWindowSize: 8,
        maxResponseLength: 2000,
      }
    } else {
      settings = settings.toObject()
      delete settings._id
      delete settings.__v
      delete settings.setting_type
      delete settings.created_at
      delete settings.updated_at
    }

    // Keep global cache in sync
    global.modelSettings = settings

    res.json({
      settings,
      source: "database",
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[ERROR] Failed to fetch model settings:", err)
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
  updateModelSettings,
  getModelSettings,
}
