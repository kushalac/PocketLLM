const mongoose = require("mongoose")

const chatSessionSchema = new mongoose.Schema({
  _id: String,
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    default: "New Chat",
  },
  title_locked: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  message_count: {
    type: Number,
    default: 0,
  },
})

module.exports = mongoose.model("ChatSession", chatSessionSchema)
