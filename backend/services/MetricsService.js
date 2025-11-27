class MetricsService {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      totalChats: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      lastResponseTime: 0,
      documentsUploaded: 0,
      responseTimes: [],
    }
  }

  recordRequest() {
    this.metrics.totalRequests++
  }

  recordChat() {
    this.metrics.totalChats++
  }

  recordMessage() {
    this.metrics.totalMessages++
  }

  recordResponseTime(time) {
    this.metrics.responseTimes.push(time)
    this.metrics.averageResponseTime =
      this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
    this.metrics.lastResponseTime = time
  }

  recordDocumentUpload() {
    this.metrics.documentsUploaded++
  }

  getMetrics() {
    const times = this.metrics.responseTimes.slice(-100)
    const sorted = [...times].sort((a, b) => a - b)
    const p95Index = sorted.length ? Math.floor(0.95 * (sorted.length - 1)) : 0
    return {
      ...this.metrics,
      responseTimes: times,
      p95ResponseTime: sorted[p95Index] || 0,
    }
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      totalChats: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      lastResponseTime: 0,
      documentsUploaded: 0,
      responseTimes: [],
    }
  }
}

module.exports = new MetricsService()
