const UserPreferences = require("../models/UserPreferences")

class UserPreferencesService {
  /**
   * Get user preferences with fallback to admin defaults
   * Model settings ALWAYS use admin defaults for all users
   * Only UI preferences can be customized per user
   */
  static async getUserPreferences(userId, adminSettings = null) {
    try {
      let prefs = await UserPreferences.findOne({ user_id: userId })

      if (!prefs) {
        // Create default preferences for new user
        prefs = new UserPreferences({ user_id: userId })
        await prefs.save()
      }

      // Model settings ALWAYS use admin settings (apply to all users)
      return {
        ...prefs.toObject(),
        contextWindowSize: adminSettings?.contextWindowSize || prefs.contextWindowSize,
        maxResponseLength: adminSettings?.maxResponseLength || prefs.maxResponseLength,
      }
    } catch (err) {
      console.error("Error fetching user preferences:", err)
      throw err
    }
  }

  /**
   * Update user preferences for a specific user
   */
  static async updateUserPreferences(userId, updates) {
    try {
      // Validate inputs
      if (updates.contextWindowSize && (updates.contextWindowSize < 1 || updates.contextWindowSize > 20)) {
        throw new Error("Context window size must be between 1 and 20")
      }
      if (updates.maxResponseLength && (updates.maxResponseLength < 500 || updates.maxResponseLength > 8000)) {
        throw new Error("Max response length must be between 500 and 8000 tokens")
      }
      if (updates.autoDeleteAfterDays && (updates.autoDeleteAfterDays < 7 || updates.autoDeleteAfterDays > 365)) {
        throw new Error("Auto-delete days must be between 7 and 365")
      }

      let prefs = await UserPreferences.findOne({ user_id: userId })

      if (!prefs) {
        prefs = new UserPreferences({ user_id: userId, ...updates })
      } else {
        Object.assign(prefs, updates)
      }

      await prefs.save()
      return prefs.toObject()
    } catch (err) {
      console.error("Error updating user preferences:", err)
      throw err
    }
  }

  /**
   * Reset user preferences to defaults
   */
  static async resetUserPreferences(userId) {
    try {
      const prefs = await UserPreferences.findOne({ user_id: userId })
      if (prefs) {
        await UserPreferences.deleteOne({ user_id: userId })
      }
      // Return new default preferences
      const newPrefs = new UserPreferences({ user_id: userId })
      await newPrefs.save()
      return newPrefs.toObject()
    } catch (err) {
      console.error("Error resetting user preferences:", err)
      throw err
    }
  }

  /**
   * Get only model-related settings (not UI preferences)
   * Model settings ALWAYS use admin defaults for all users
   */
  static async getUserModelSettings(userId, adminSettings = null) {
    const prefs = await this.getUserPreferences(userId, adminSettings)
    return {
      contextWindowSize: prefs.contextWindowSize,
      maxResponseLength: prefs.maxResponseLength,
    }
  }

  /**
   * Get only UI preferences
   */
  static async getUserUIPreferences(userId) {
    const prefs = await UserPreferences.findOne({ user_id: userId })
    if (!prefs) {
      return {
        themePreference: "auto",
        messageGrouping: true,
        autoScroll: true,
        showTimestamps: false,
      }
    }
    return {
      themePreference: prefs.themePreference,
      messageGrouping: prefs.messageGrouping,
      autoScroll: prefs.autoScroll,
      showTimestamps: prefs.showTimestamps,
    }
  }
}

module.exports = UserPreferencesService
