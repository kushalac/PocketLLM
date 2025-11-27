const express = require("express")
const { authMiddleware } = require("../utils/jwt")
const {
  startSession,
  getSessions,
  sendMessage,
  renameSession,
  deleteSession,
  exportSession,
  uploadDocument,
  listDocuments,
  deleteDocument,
} = require("../controllers/chatController")

const router = express.Router()

router.post("/start", authMiddleware, startSession)
router.get("/sessions", authMiddleware, getSessions)
router.post("/send", authMiddleware, sendMessage)
router.patch("/rename/:sessionId", authMiddleware, renameSession)
router.delete("/session/:sessionId", authMiddleware, deleteSession)
router.get("/export/:sessionId", authMiddleware, exportSession)
router.post("/documents", authMiddleware, uploadDocument)
router.get("/documents", authMiddleware, listDocuments)
router.delete("/documents/:documentId", authMiddleware, deleteDocument)

module.exports = router
