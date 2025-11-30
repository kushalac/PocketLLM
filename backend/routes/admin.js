const express = require("express")
const { adminMiddleware } = require("../utils/jwt")
const {
  getLogs,
  getMetrics,
  getCacheStats,
  clearCache,
  clearLogs,
  resetMetrics,
  updateModelSettings,
  getModelSettings,
} = require("../controllers/adminController")

const router = express.Router()

router.get("/logs", adminMiddleware, getLogs)
router.get("/metrics", adminMiddleware, getMetrics)
router.get("/cache", adminMiddleware, getCacheStats)
router.delete("/cache", adminMiddleware, clearCache)
router.delete("/logs", adminMiddleware, clearLogs)
router.post("/metrics/reset", adminMiddleware, resetMetrics)
router.get("/model-settings", adminMiddleware, getModelSettings)
router.post("/model-settings", adminMiddleware, updateModelSettings)

module.exports = router
