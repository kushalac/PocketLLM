const mongoose = require("mongoose")

let isConnected = false

const initDB = async () => {
  if (isConnected) {
    console.log("Database already connected")
    return mongoose.connection
  }

  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) throw new Error("MONGODB_URI is not set")

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    isConnected = true
    console.log("Connected to MongoDB")
    return mongoose.connection
  } catch (error) {
    console.error("MongoDB connection error:", error.message)
    throw error
  }
}

module.exports = { initDB, mongoose }
