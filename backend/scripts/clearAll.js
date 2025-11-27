/**
 * Script to clear all data from the database
 * Usage: node scripts/clearAll.js
 * WARNING: This will delete ALL data including users, sessions, messages, documents, logs, and metrics
 */

const mongoose = require("mongoose")
const User = require("../models/User")
const ChatSession = require("../models/ChatSession")
const Message = require("../models/Message")
const Document = require("../models/Document")
const Log = require("../models/Log")
const Metrics = require("../models/Metrics")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pocketllm"

async function clearAll() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB\n")

    console.log("⚠️  WARNING: This will delete ALL data from the database!")
    console.log("Clearing in 3 seconds...\n")
    
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Delete all collections
    await User.deleteMany({})
    console.log("✓ Deleted all users")
    
    await ChatSession.deleteMany({})
    console.log("✓ Deleted all chat sessions")
    
    await Message.deleteMany({})
    console.log("✓ Deleted all messages")
    
    await Document.deleteMany({})
    console.log("✓ Deleted all documents")
    
    await Log.deleteMany({})
    console.log("✓ Deleted all logs")
    
    await Metrics.deleteMany({})
    console.log("✓ Deleted all metrics")

    console.log("\n✅ All data cleared successfully!")
    console.log("\nYou can now:")
    console.log("1. Register a new user at /register")
    console.log("2. Make them admin: docker exec -it <container> node scripts/makeAdmin.js <username>")
    console.log("3. Log in and start fresh!")
    
    process.exit(0)
  } catch (error) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

clearAll()
