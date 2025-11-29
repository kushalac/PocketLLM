import axios from "axios"
import IndexedDBCache from "./IndexedDBCache"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

class AuthService {
  async register(username, email, password) {
    const payload = { username, email, password }
    try {
      const res = await axios.post(`${API_URL}/auth/register`, payload, {
        headers: { "Content-Type": "application/json" },
      })
      return res.data
    } catch (err) {
      throw err
    }
  }

  async login(username, password) {
    const payload = { username, password }
    try {
      const res = await axios.post(`${API_URL}/auth/login`, payload, {
        headers: { "Content-Type": "application/json" },
      })

      if (res.data.token) {
        // Store in localStorage for immediate access
        localStorage.setItem("token", res.data.token)
        localStorage.setItem("user", JSON.stringify(res.data.user))

        // Also store in IndexedDB for persistence
        await IndexedDBCache.setUserData("token", res.data.token)
        await IndexedDBCache.setUserData("user", res.data.user)
      }

      return res.data
    } catch (err) {
      throw err
    }
  }

  async logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    // Clear IndexedDB cache
    await IndexedDBCache.deleteUserData("token")
    await IndexedDBCache.deleteUserData("user")
    await IndexedDBCache.clearAll()
  }

  getToken() {
    return localStorage.getItem("token")
  }

  getUser() {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  }

  isAuthenticated() {
    return !!this.getToken()
  }

  // Restore session from IndexedDB if localStorage is cleared
  async restoreSession() {
    const token = this.getToken()
    if (!token) {
      // Try to restore from IndexedDB
      const cachedToken = await IndexedDBCache.getUserData("token")
      const cachedUser = await IndexedDBCache.getUserData("user")

      if (cachedToken && cachedUser) {
        localStorage.setItem("token", cachedToken)
        localStorage.setItem("user", JSON.stringify(cachedUser))
        console.log("Session restored from IndexedDB")
        return true
      }
    }
    return false
  }
}

export default new AuthService()
