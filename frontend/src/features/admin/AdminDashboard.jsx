"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "../../core/ApiService"
import IndexedDBCache from "../../core/IndexedDBCache"
import ChatSessionService from "../../core/ChatSessionService"
import MetricsChart from "./MetricsChart"
import CacheStats from "./CacheStats"
import LogsView from "./LogsView"

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [cacheStats, setCacheStats] = useState(null)
  const [indexedDBStats, setIndexedDBStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    loadAdminData()
    const interval = setInterval(loadAdminData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadAdminData = async () => {
    try {
      const [metricsRes, cacheRes, logsRes, idbStats] = await Promise.all([
        apiClient.get("/admin/metrics"),
        apiClient.get("/admin/cache"),
        apiClient.get("/admin/logs"),
        IndexedDBCache.getStats(),
      ])

      setMetrics(metricsRes.data.metrics)
      setCacheStats(cacheRes.data.stats)
      setIndexedDBStats(idbStats)
      setLogs(logsRes.data.logs)
      setError("")
    } catch (err) {
      console.error("Admin dashboard error:", err)
      setError(`Failed to load admin data: ${err.response?.data?.error || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = async () => {
    try {
      await apiClient.delete("/admin/cache")
      await loadAdminData()
    } catch (err) {
      setError("Failed to clear cache")
    }
  }

  const handleClearIndexedDBCache = async () => {
    try {
      await ChatSessionService.clearCache()
      await loadAdminData()
    } catch (err) {
      setError("Failed to clear IndexedDB cache")
    }
  }

  const handleClearLogs = async () => {
    try {
      await apiClient.delete("/admin/logs")
      await loadAdminData()
    } catch (err) {
      setError("Failed to clear logs")
    }
  }

  const handleResetMetrics = async () => {
    try {
      await apiClient.post("/admin/metrics/reset")
      await loadAdminData()
    } catch (err) {
      setError("Failed to reset metrics")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={() => navigate("/chat")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back to Chat
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total Requests</p>
            <p className="text-4xl font-bold text-blue-600">{metrics?.totalRequests || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total Chats</p>
            <p className="text-4xl font-bold text-green-600">{metrics?.totalChats || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Total Messages</p>
            <p className="text-4xl font-bold text-purple-600">{metrics?.totalMessages || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <MetricsChart metrics={metrics} onReset={handleResetMetrics} />
          <CacheStats stats={cacheStats} onClear={handleClearCache} />
        </div>

        {/* IndexedDB Cache Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">IndexedDB Cache</h2>
            <button
              onClick={handleClearIndexedDBCache}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
            >
              Clear IndexedDB
            </button>
          </div>

          {indexedDBStats && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Sessions</p>
                <p className="text-2xl font-bold text-blue-600">{indexedDBStats.sessions}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Messages</p>
                <p className="text-2xl font-bold text-green-600">{indexedDBStats.messages}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">User Data</p>
                <p className="text-2xl font-bold text-purple-600">{indexedDBStats.userData}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">API Cache</p>
                <p className="text-2xl font-bold text-orange-600">{indexedDBStats.apiCache}</p>
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium">Total cached items: {indexedDBStats?.total || 0}</p>
            <p className="text-xs text-gray-500 mt-2">
              IndexedDB provides persistent caching across browser sessions. Data is cached automatically to improve
              performance.
            </p>
          </div>
        </div>

        <LogsView logs={logs} onClear={handleClearLogs} />
      </div>
    </div>
  )
}
