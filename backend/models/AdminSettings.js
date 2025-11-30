const mongoose = require("mongoose")

const adminSettingsSchema = new mongoose.Schema({
  setting_type: {
    type: String,
    enum: ["model_settings"],
    unique: true,
    default: "model_settings",
  },
  // Model configuration settings that directly affect Ollama
  contextWindowSize: {
    type: Number,
    default: 8,
    min: 1,
    max: 20,
  },
  maxResponseLength: {
    type: Number,
    default: 2000,
    min: 500,
    max: 8000,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
})

// Update the updated_at field before saving
adminSettingsSchema.pre("save", function (next) {
  this.updated_at = Date.now()
  next()
})

module.exports = mongoose.model("AdminSettings", adminSettingsSchema)
