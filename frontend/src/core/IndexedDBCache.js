/**
 * IndexedDB Cache Service
 * Provides persistent caching for chat sessions, messages, and user data
 */

const DB_NAME = "PocketLLMCache"
const DB_VERSION = 1

// Store names
const STORES = {
  SESSIONS: "sessions",
  MESSAGES: "messages",
  USER_DATA: "userData",
  API_CACHE: "apiCache",
}

class IndexedDBCache {
  constructor() {
    this.db = null
    this.initPromise = this.init()
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error("IndexedDB failed to open", request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log("IndexedDB initialized successfully")
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Sessions store
        if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
          const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: "id" })
          sessionsStore.createIndex("updated_at", "updated_at", { unique: false })
          sessionsStore.createIndex("created_at", "created_at", { unique: false })
        }

        // Messages store - grouped by session
        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          const messagesStore = db.createObjectStore(STORES.MESSAGES, { keyPath: "id" })
          messagesStore.createIndex("sessionId", "sessionId", { unique: false })
          messagesStore.createIndex("created_at", "created_at", { unique: false })
        }

        // User data store
        if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
          db.createObjectStore(STORES.USER_DATA, { keyPath: "key" })
        }

        // Generic API cache
        if (!db.objectStoreNames.contains(STORES.API_CACHE)) {
          const apiCacheStore = db.createObjectStore(STORES.API_CACHE, { keyPath: "key" })
          apiCacheStore.createIndex("timestamp", "timestamp", { unique: false })
        }
      }
    })
  }

  async ensureDB() {
    if (!this.db) {
      await this.initPromise
    }
    return this.db
  }

  // ========== Sessions ==========

  async saveSessions(sessions) {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.SESSIONS], "readwrite")
      const store = tx.objectStore(STORES.SESSIONS)

      // Clear old sessions first
      await store.clear()

      // Save new sessions
      for (const session of sessions) {
        await store.put({
          ...session,
          cachedAt: Date.now(),
        })
      }

      await tx.complete
      console.log(`Cached ${sessions.length} sessions to IndexedDB`)
    } catch (error) {
      console.error("Failed to save sessions to IndexedDB:", error)
    }
  }

  async getSessions() {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.SESSIONS], "readonly")
      const store = tx.objectStore(STORES.SESSIONS)
      const index = store.index("updated_at")

      return new Promise((resolve, reject) => {
        const request = index.openCursor(null, "prev") // Most recent first
        const sessions = []

        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            sessions.push(cursor.value)
            cursor.continue()
          } else {
            resolve(sessions)
          }
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Failed to get sessions from IndexedDB:", error)
      return []
    }
  }

  async getSession(sessionId) {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.SESSIONS], "readonly")
      const store = tx.objectStore(STORES.SESSIONS)

      return new Promise((resolve, reject) => {
        const request = store.get(sessionId)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Failed to get session from IndexedDB:", error)
      return null
    }
  }

  async deleteSession(sessionId) {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.SESSIONS, STORES.MESSAGES], "readwrite")
      
      // Delete session
      await tx.objectStore(STORES.SESSIONS).delete(sessionId)
      
      // Delete all messages for this session
      const messagesStore = tx.objectStore(STORES.MESSAGES)
      const index = messagesStore.index("sessionId")
      const messages = await new Promise((resolve, reject) => {
        const request = index.getAllKeys(sessionId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      for (const messageId of messages) {
        await messagesStore.delete(messageId)
      }

      await tx.complete
      console.log(`Deleted session ${sessionId} and its messages from IndexedDB`)
    } catch (error) {
      console.error("Failed to delete session from IndexedDB:", error)
    }
  }

  // ========== Messages ==========

  async saveMessages(sessionId, messages) {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.MESSAGES], "readwrite")
      const store = tx.objectStore(STORES.MESSAGES)

      // Delete old messages for this session
      const index = store.index("sessionId")
      const oldMessages = await new Promise((resolve, reject) => {
        const request = index.getAllKeys(sessionId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      for (const messageId of oldMessages) {
        await store.delete(messageId)
      }

      // Save new messages
      for (const message of messages) {
        await store.put({
          ...message,
          sessionId,
          cachedAt: Date.now(),
        })
      }

      await tx.complete
      console.log(`Cached ${messages.length} messages for session ${sessionId}`)
    } catch (error) {
      console.error("Failed to save messages to IndexedDB:", error)
    }
  }

  async clearMessagesForSession(sessionId) {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.MESSAGES], "readwrite")
      const store = tx.objectStore(STORES.MESSAGES)
      const index = store.index("sessionId")

      const messageIds = await new Promise((resolve, reject) => {
        const request = index.getAllKeys(sessionId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      for (const messageId of messageIds) {
        await store.delete(messageId)
      }

      await tx.complete
      console.log(`Cleared message cache for session ${sessionId}`)
    } catch (error) {
      console.error("Failed to clear messages from IndexedDB:", error)
    }
  }

  async getMessages(sessionId) {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.MESSAGES], "readonly")
      const store = tx.objectStore(STORES.MESSAGES)
      const index = store.index("sessionId")

      return new Promise((resolve, reject) => {
        const request = index.getAll(sessionId)
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Failed to get messages from IndexedDB:", error)
      return []
    }
  }

  // ========== User Data ==========

  async setUserData(key, value) {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.USER_DATA], "readwrite")
      const store = tx.objectStore(STORES.USER_DATA)

      await store.put({
        key,
        value,
        timestamp: Date.now(),
      })

      await tx.complete
    } catch (error) {
      console.error("Failed to save user data to IndexedDB:", error)
    }
  }

  async getUserData(key) {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.USER_DATA], "readonly")
      const store = tx.objectStore(STORES.USER_DATA)

      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.value : null)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Failed to get user data from IndexedDB:", error)
      return null
    }
  }

  async deleteUserData(key) {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.USER_DATA], "readwrite")
      const store = tx.objectStore(STORES.USER_DATA)

      await store.delete(key)
      await tx.complete
    } catch (error) {
      console.error("Failed to delete user data from IndexedDB:", error)
    }
  }

  // ========== API Cache ==========

  async setCache(key, data, ttl = 300000) {
    // Default 5 minutes TTL
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.API_CACHE], "readwrite")
      const store = tx.objectStore(STORES.API_CACHE)

      await store.put({
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      })

      await tx.complete
    } catch (error) {
      console.error("Failed to save to API cache:", error)
    }
  }

  async getCache(key) {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.API_CACHE], "readonly")
      const store = tx.objectStore(STORES.API_CACHE)

      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onsuccess = () => {
          const result = request.result
          if (!result) {
            resolve(null)
            return
          }

          // Check if expired
          if (Date.now() > result.expiresAt) {
            // Expired - delete it
            this.deleteCache(key)
            resolve(null)
            return
          }

          resolve(result.data)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Failed to get from API cache:", error)
      return null
    }
  }

  async deleteCache(key) {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.API_CACHE], "readwrite")
      const store = tx.objectStore(STORES.API_CACHE)

      await store.delete(key)
      await tx.complete
    } catch (error) {
      console.error("Failed to delete from API cache:", error)
    }
  }

  async clearExpiredCache() {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction([STORES.API_CACHE], "readwrite")
      const store = tx.objectStore(STORES.API_CACHE)
      const index = store.index("timestamp")

      const now = Date.now()
      const request = index.openCursor()

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          if (cursor.value.expiresAt < now) {
            cursor.delete()
          }
          cursor.continue()
        }
      }

      await tx.complete
    } catch (error) {
      console.error("Failed to clear expired cache:", error)
    }
  }

  // ========== Utilities ==========

  async clearAll() {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction(
        [STORES.SESSIONS, STORES.MESSAGES, STORES.USER_DATA, STORES.API_CACHE],
        "readwrite",
      )

      await tx.objectStore(STORES.SESSIONS).clear()
      await tx.objectStore(STORES.MESSAGES).clear()
      await tx.objectStore(STORES.USER_DATA).clear()
      await tx.objectStore(STORES.API_CACHE).clear()

      await tx.complete
      console.log("Cleared all IndexedDB cache")
    } catch (error) {
      console.error("Failed to clear IndexedDB cache:", error)
    }
  }

  async getStats() {
    try {
      const db = await this.ensureDB()
      const tx = db.transaction(
        [STORES.SESSIONS, STORES.MESSAGES, STORES.USER_DATA, STORES.API_CACHE],
        "readonly",
      )

      const getCount = (store) => {
        return new Promise((resolve, reject) => {
          const request = tx.objectStore(store).count()
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
      }

      const counts = await Promise.all([
        getCount(STORES.SESSIONS),
        getCount(STORES.MESSAGES),
        getCount(STORES.USER_DATA),
        getCount(STORES.API_CACHE),
      ])

      return {
        sessions: counts[0],
        messages: counts[1],
        userData: counts[2],
        apiCache: counts[3],
        total: counts.reduce((a, b) => a + b, 0),
      }
    } catch (error) {
      console.error("Failed to get IndexedDB stats:", error)
      return { sessions: 0, messages: 0, userData: 0, apiCache: 0, total: 0 }
    }
  }
}

// Export singleton instance
export default new IndexedDBCache()
