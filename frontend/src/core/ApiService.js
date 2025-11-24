import axios from "axios"
import AuthService from "./AuthService"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

const apiClient = axios.create({
  baseURL: API_URL,
})

// Add token to every request
apiClient.interceptors.request.use((config) => {
  const token = AuthService.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
