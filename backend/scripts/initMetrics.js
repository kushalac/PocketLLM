/**
 * Script to initialize metrics based on existing database data
 * Usage: node scripts/initMetrics.js
 */

const mongoose = require("mongoose")
const ChatSession = require("../models/ChatSession")
const Message = require("../models/Message")
const Document = require("../models/Document")
const Metrics = require("../models/Metrics")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pocketllm"

async function initMetrics() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB\n")

    // Count existing data
    const totalChats = await ChatSession.countDocuments()
    const totalMessages = await Message.countDocuments()
    const documentsUploaded = await Document.countDocuments()

    console.log("Found existing data:")
    console.log(`  - Chat sessions: ${totalChats}`)
    console.log(`  - Messages: ${totalMessages}`)
    console.log(`  - Documents: ${documentsUploaded}`)

    // Update or create metrics
    await Metrics.findOneAndUpdate(
      { _id: "global_metrics" },
      {
        $set: {
          totalChats,
          totalMessages,
          documentsUploaded,
          updated_at: new Date(),
        },
      },
      { upsert: true },
    )

    console.log("\n✅ Metrics initialized successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

initMetrics()
