"use client"

import { useState, useEffect } from "react"
import apiClient from "../../core/ApiService"

export default function UserModelSettings() {
  const [settings, setSettings] = useState({
    contextWindowSize: 8,
    maxResponseLength: 2000,
  })

  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await apiClient.get("/preferences")
      setSettings(response.data.preferences)
      setIsLoading(false)
    } catch (err) {
      console.error("Failed to load preferences:", err)
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: parseFloat(value) || value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      await apiClient.put("/preferences", settings)
      setSuccess("Settings saved successfully")
      setIsEditing(false)

      setTimeout(() => {
        setSuccess("")
        setIsExpanded(false)
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm("Reset all settings to defaults?")) return

    setIsSaving(true)
    setError("")

    try {
      const response = await apiClient.post("/preferences/reset")
      setSettings(response.data.preferences)
      setSuccess("Settings reset to defaults")
      setIsEditing(false)

      setTimeout(() => {
        setSuccess("")
        setIsExpanded(false)
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="border-t border-gray-200 p-4">
        <div className="text-sm text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium text-gray-700">Model Settings</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 py-4 space-y-4 border-t border-gray-200">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">{success}</div>}

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Context Window Size */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">Context Window</label>
              <p className="text-xs text-gray-500 mb-2">Previous messages as context</p>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.contextWindowSize}
                    onChange={(e) => handleInputChange("contextWindowSize", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    min="1"
                    max="20"
                  />
                  <span className="text-xs text-gray-600 whitespace-nowrap">msgs</span>
                </div>
              ) : (
                <div className="text-lg font-semibold text-gray-800">{settings.contextWindowSize}</div>
              )}
            </div>

            {/* Max Response Length */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Response Length</label>
              <p className="text-xs text-gray-500 mb-2">Maximum tokens in response (~4 chars/token)</p>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.maxResponseLength}
                    onChange={(e) => handleInputChange("maxResponseLength", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    min="500"
                    max="8000"
                  />
                  <span className="text-xs text-gray-600 whitespace-nowrap">tok</span>
                </div>
              ) : (
                <div className="text-lg font-semibold text-gray-800">
                  {settings.maxResponseLength}
                  <span className="text-xs font-normal text-gray-500 ml-1">tokens</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Edit Settings
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition text-sm font-medium"
                  title="Reset all settings to defaults"
                >
                  ↺ Reset
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition text-sm font-medium"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    loadSettings() // Reload original settings
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          <div className="text-xs text-gray-500 text-center pt-2">
            Last updated: {new Date(settings.updated_at || Date.now()).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  )
}
