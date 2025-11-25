const mongoose = require("mongoose")

const documentSchema = new mongoose.Schema({
  _id: String,
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  source: {
    type: String,
    default: "manual",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Document", documentSchema)
