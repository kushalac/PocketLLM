class MetricsService {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      totalChats: 0,
      totalMessages: 0,
      averageResponseTime: 0,
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
  }

  getMetrics() {
    return {
      ...this.metrics,
      responseTimes: this.metrics.responseTimes.slice(-100), // Keep last 100
    }
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      totalChats: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      responseTimes: [],
    }
  }
}

module.exports = new MetricsService()
