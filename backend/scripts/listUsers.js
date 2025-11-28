/**
 * Script to list all users in the database
 * Usage: node scripts/listUsers.js
 */

const mongoose = require("mongoose")
const User = require("../models/User")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pocketllm"

async function listUsers() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB\n")

    const users = await User.find({}, { password: 0 }).sort({ created_at: -1 })

    if (users.length === 0) {
      console.log("No users found in the database.")
      console.log("Register a user at /register to get started.")
      process.exit(0)
    }

    console.log(`Found ${users.length} user(s):\n`)
    console.log("┌─────────────────────┬──────────────────────────────┬────────────┬─────────────────────┐")
    console.log("│ Username            │ Email                        │ Admin      │ Created             │")
    console.log("├─────────────────────┼──────────────────────────────┼────────────┼─────────────────────┤")

    users.forEach((user) => {
      const username = user.username.padEnd(19).substring(0, 19)
      const email = user.email.padEnd(28).substring(0, 28)
      const isAdmin = user.is_admin ? "✓ Yes" : "✗ No"
      const adminFormatted = isAdmin.padEnd(10)
      const created = new Date(user.created_at).toLocaleDateString()
      const createdFormatted = created.padEnd(19)

      console.log(`│ ${username} │ ${email} │ ${adminFormatted} │ ${createdFormatted} │`)
    })

    console.log("└─────────────────────┴──────────────────────────────┴────────────┴─────────────────────┘")
    console.log()

    process.exit(0)
  } catch (error) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

listUsers()
