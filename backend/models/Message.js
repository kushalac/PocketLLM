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
  created_at: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Message", messageSchema)
