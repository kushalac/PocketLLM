/**
 * Script to make a user an admin
 * Usage: node scripts/makeAdmin.js <username>
 */

const mongoose = require("mongoose")
const User = require("../models/User")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pocketllm"

async function makeAdmin(username) {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB")

    const user = await User.findOne({ username })

    if (!user) {
      console.error(`❌ User "${username}" not found`)
      
      // Show available users
      const allUsers = await User.find({}, { username: 1, is_admin: 1 })
      if (allUsers.length > 0) {
        console.log("\nAvailable users:")
        allUsers.forEach(u => {
          const adminBadge = u.is_admin ? " (admin)" : ""
          console.log(`  - ${u.username}${adminBadge}`)
        })
      } else {
        console.log("\nNo users found in the database. Register a user first.")
      }
      
      process.exit(1)
    }

    if (user.is_admin) {
      console.log(`User "${username}" is already an admin`)
      process.exit(0)
    }

    user.is_admin = true
    await user.save()

    console.log(`✅ User "${username}" is now an admin!`)
    process.exit(0)
  } catch (error) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

const username = process.argv[2]

if (!username) {
  console.error("Usage: node scripts/makeAdmin.js <username>")
  process.exit(1)
}

makeAdmin(username)
