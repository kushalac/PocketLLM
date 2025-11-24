const express = require("express")
const { authMiddleware } = require("../utils/jwt")
const {
  startSession,
  getSessions,
  sendMessage,
  renameSession,
  deleteSession,
  exportSession,
} = require("../controllers/chatController")

const router = express.Router()

router.post("/start", authMiddleware, startSession)
router.get("/sessions", authMiddleware, getSessions)
router.post("/send", authMiddleware, sendMessage)
router.patch("/rename/:sessionId", authMiddleware, renameSession)
router.delete("/session/:sessionId", authMiddleware, deleteSession)
router.get("/export/:sessionId", authMiddleware, exportSession)

module.exports = router
