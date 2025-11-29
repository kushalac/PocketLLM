const mongoose = require("mongoose")

const userPreferencesSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Model configuration settings
    contextWindowSize: {
      type: Number,
      default: 8, // 1-20 messages
      min: 1,
      max: 20,
    },
    maxResponseLength: {
      type: Number,
      default: 2000, // 500-8000 tokens
      min: 500,
      max: 8000,
    },
    enableCaching: {
      type: Boolean,
      default: true,
    },
    enableLogging: {
      type: Boolean,
      default: true,
    },
    // UI preferences
    themePreference: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto",
    },
    messageGrouping: {
      type: Boolean,
      default: true, // Group messages by user/assistant
    },
    autoScroll: {
      type: Boolean,
      default: true, // Auto-scroll to latest message
    },
    showTimestamps: {
      type: Boolean,
      default: false,
    },
    // Privacy settings
    saveHistory: {
      type: Boolean,
      default: true,
    },
    autoDeleteAfterDays: {
      type: Number,
      default: null, // null = never auto-delete
      min: 7,
      max: 365,
    },
    useDefaults: {
      type: Boolean,
      default: true, // If true, use admin defaults instead of custom preferences
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
)

// Update the updated_at field before saving
userPreferencesSchema.pre("save", function (next) {
  this.updated_at = Date.now()
  next()
})

module.exports = mongoose.model("UserPreferences", userPreferencesSchema)
