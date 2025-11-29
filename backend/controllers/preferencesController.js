const UserPreferencesService = require("../services/UserPreferencesService")
const LogService = require("../services/LogService")
const AdminSettings = require("../models/AdminSettings")

const getUserPreferences = async (req, res) => {
  try {
    const prefs = await UserPreferencesService.getUserPreferences(req.user.id)
    res.json({ preferences: prefs })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateUserPreferences = async (req, res) => {
  try {
    const allowedFields = [
      "contextWindowSize",
      "maxResponseLength",
      "enableCaching",
      "enableLogging",
      "themePreference",
      "messageGrouping",
      "autoScroll",
      "showTimestamps",
      "saveHistory",
      "autoDeleteAfterDays",
    ]

    // Only allow updating specific fields
    const updates = {}
    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field]
      }
    }

    const prefs = await UserPreferencesService.updateUserPreferences(req.user.id, updates)

    await LogService.log("USER_PREFERENCES_UPDATED", "User updated personal model preferences", {
      updates,
      user_id: req.user.id,
    })

    res.json({
      message: "Preferences updated successfully",
      preferences: prefs,
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const resetUserPreferences = async (req, res) => {
  try {
    const prefs = await UserPreferencesService.resetUserPreferences(req.user.id)

    await LogService.log("USER_PREFERENCES_RESET", "User reset personal preferences to defaults", {
      user_id: req.user.id,
    })

    res.json({
      message: "Preferences reset to defaults",
      preferences: prefs,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getUserModelSettings = async (req, res) => {
  try {
    // Try to fetch admin settings from database (primary source of truth)
    // Falls back to global.modelSettings cache if DB is temporarily unavailable
    let adminSettings = null
    try {
      const adminSettingsDoc = await AdminSettings.findOne({ setting_type: "model_settings" })
      if (adminSettingsDoc) {
        adminSettings = adminSettingsDoc.toObject()
        // Clean up MongoDB metadata
        delete adminSettings._id
        delete adminSettings.__v
        delete adminSettings.setting_type
        delete adminSettings.created_at
        delete adminSettings.updated_at
      }
    } catch (dbErr) {
      console.warn("Failed to fetch admin settings from DB, using cache:", dbErr.message)
      // Fall back to global cache if DB fails
      adminSettings = global.modelSettings || null
    }

    // Get user's effective settings (merged with admin defaults - applies to all users)
    const settings = await UserPreferencesService.getUserModelSettings(req.user.id, adminSettings)

    res.json({ settings })
  } catch (err) {
    console.error("Error fetching user model settings:", err)
    res.status(500).json({ error: err.message })
  }
}

const getUserUIPreferences = async (req, res) => {
  try {
    const prefs = await UserPreferencesService.getUserUIPreferences(req.user.id)
    res.json({ preferences: prefs })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  resetUserPreferences,
  getUserModelSettings,
  getUserUIPreferences,
}
