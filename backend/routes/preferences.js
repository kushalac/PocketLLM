const express = require("express")
const { authMiddleware } = require("../utils/jwt")
const {
  getUserPreferences,
  updateUserPreferences,
  resetUserPreferences,
  getUserModelSettings,
  getUserUIPreferences,
} = require("../controllers/preferencesController")

const router = express.Router()

// All preferences routes require authentication
router.use(authMiddleware)

// Get all user preferences
router.get("/", getUserPreferences)

// Update user preferences
router.put("/", updateUserPreferences)

// Reset preferences to defaults
router.post("/reset", resetUserPreferences)

// Get only model-related settings
router.get("/model-settings", getUserModelSettings)

// Get only UI preferences
router.get("/ui", getUserUIPreferences)

module.exports = router
