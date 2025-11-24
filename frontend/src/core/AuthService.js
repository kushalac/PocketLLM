import axios from "axios"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

class AuthService {
  register(username, email, password) {
    const payload = { username, email, password }
    return axios.post(`${API_URL}/auth/register`, payload, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.data)
      .catch((err) => {
        throw err
      })
  }

  login(username, password) {
    const payload = { username, password }
    return axios.post(`${API_URL}/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        if (res.data.token) {
          localStorage.setItem("token", res.data.token)
          localStorage.setItem("user", JSON.stringify(res.data.user))
        }
        return res.data
      })
  }

  logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
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
}

export default new AuthService()
