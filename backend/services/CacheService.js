class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize
    this.cache = new Map()
    
    // Clean up expired entries every 60 seconds
    setInterval(() => this.cleanupExpired(), 60000)
  }

  set(key, value, ttl = null) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    const entry = {
      value,
      expiresAt: ttl ? Date.now() + ttl : null,
    }

    this.cache.set(key, entry)

    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null
    }

    const entry = this.cache.get(key)
    
    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Move to end (LRU)
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.value
  }

  delete(key) {
    this.cache.delete(key)
  }

  cleanupExpired() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  stats() {
    // Clean up expired before reporting stats
    this.cleanupExpired()
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    }
  }

  clear() {
    this.cache.clear()
  }
}

module.exports = new LRUCache(100)
