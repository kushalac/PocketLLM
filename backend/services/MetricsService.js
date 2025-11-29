const Metrics = require("../models/Metrics")

class MetricsService {
  constructor() {
    this.loaded = false
    this.loadMetrics()
  }

  async loadMetrics() {
    try {
      let metrics = await Metrics.findById("global_metrics")
      if (!metrics) {
        // Create initial metrics document
        metrics = new Metrics({ _id: "global_metrics" })
        await metrics.save()
      }
      this.loaded = true
    } catch (error) {
      console.error("Failed to load metrics:", error)
    }
  }

  async ensureLoaded() {
    if (!this.loaded) {
      await this.loadMetrics()
    }
  }

  async recordRequest() {
    await this.ensureLoaded()
    try {
      await Metrics.findByIdAndUpdate("global_metrics", {
        $inc: { totalRequests: 1 },
        $set: { updated_at: new Date() },
      })
    } catch (error) {
      console.error("Failed to record request:", error)
    }
  }

  async recordChat() {
    await this.ensureLoaded()
    try {
      await Metrics.findByIdAndUpdate("global_metrics", {
        $inc: { totalChats: 1 },
        $set: { updated_at: new Date() },
      })
    } catch (error) {
      console.error("Failed to record chat:", error)
    }
  }

  async recordMessage() {
    await this.ensureLoaded()
    try {
      await Metrics.findByIdAndUpdate("global_metrics", {
        $inc: { totalMessages: 1 },
        $set: { updated_at: new Date() },
      })
    } catch (error) {
      console.error("Failed to record message:", error)
    }
  }

  async recordResponseTime(time) {
    await this.ensureLoaded()
    try {
      const metrics = await Metrics.findById("global_metrics")
      if (!metrics) return

      // Keep only last 100 response times
      const times = [...metrics.responseTimes, time].slice(-100)
      const average = times.reduce((a, b) => a + b, 0) / times.length

      await Metrics.findByIdAndUpdate("global_metrics", {
        $set: {
          responseTimes: times,
          lastResponseTime: time,
          averageResponseTime: average,
          updated_at: new Date(),
        },
      })
    } catch (error) {
      console.error("Failed to record response time:", error)
    }
  }

  async recordDocumentUpload() {
    await this.ensureLoaded()
    try {
      await Metrics.findByIdAndUpdate("global_metrics", {
        $inc: { documentsUploaded: 1 },
        $set: { updated_at: new Date() },
      })
    } catch (error) {
      console.error("Failed to record document upload:", error)
    }
  }

  async getMetrics() {
    await this.ensureLoaded()
    try {
      const metrics = await Metrics.findById("global_metrics")
      if (!metrics) {
        return {
          totalRequests: 0,
          totalChats: 0,
          totalMessages: 0,
          averageResponseTime: 0,
          lastResponseTime: 0,
          documentsUploaded: 0,
          responseTimes: [],
          p95ResponseTime: 0,
        }
      }

      const times = metrics.responseTimes || []
      const sorted = [...times].sort((a, b) => a - b)
      const p95Index = sorted.length ? Math.floor(0.95 * (sorted.length - 1)) : 0

      return {
        totalRequests: metrics.totalRequests,
        totalChats: metrics.totalChats,
        totalMessages: metrics.totalMessages,
        averageResponseTime: metrics.averageResponseTime,
        lastResponseTime: metrics.lastResponseTime,
        documentsUploaded: metrics.documentsUploaded,
        responseTimes: times,
        p95ResponseTime: sorted[p95Index] || 0,
      }
    } catch (error) {
      console.error("Failed to get metrics:", error)
      return {
        totalRequests: 0,
        totalChats: 0,
        totalMessages: 0,
        averageResponseTime: 0,
        lastResponseTime: 0,
        documentsUploaded: 0,
        responseTimes: [],
        p95ResponseTime: 0,
      }
    }
  }

  async reset() {
    await this.ensureLoaded()
    try {
      await Metrics.findByIdAndUpdate("global_metrics", {
        $set: {
          totalRequests: 0,
          totalChats: 0,
          totalMessages: 0,
          averageResponseTime: 0,
          lastResponseTime: 0,
          documentsUploaded: 0,
          responseTimes: [],
          updated_at: new Date(),
        },
      })
    } catch (error) {
      console.error("Failed to reset metrics:", error)
    }
  }
}

module.exports = new MetricsService()
