const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  _id: String,
  session_id: {
    type: String,
    ref: "ChatSession",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["completed", "aborted"],
    default: "completed",
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  evidence: [
    {
      source: String,
      snippet: String,
      citation: String,
      confidence: Number,
    },
  ],
})

module.exports = mongoose.model("Message", messageSchema)
