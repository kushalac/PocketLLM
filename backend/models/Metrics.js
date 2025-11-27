const mongoose = require("mongoose")

const metricsSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: "global_metrics",
  },
  totalRequests: {
    type: Number,
    default: 0,
  },
  totalChats: {
    type: Number,
    default: 0,
  },
  totalMessages: {
    type: Number,
    default: 0,
  },
  documentsUploaded: {
    type: Number,
    default: 0,
  },
  responseTimes: {
    type: [Number],
    default: [],
  },
  lastResponseTime: {
    type: Number,
    default: 0,
  },
  averageResponseTime: {
    type: Number,
    default: 0,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Metrics", metricsSchema)
