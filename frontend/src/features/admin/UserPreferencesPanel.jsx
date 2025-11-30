"use client"

import { useState, useEffect } from "react"
import apiClient from "../../core/ApiService"

export default function UserPreferencesPanel() {
  const [settings, setSettings] = useState({
    responseTimeout: 60,
    contextWindowSize: 8,
    maxResponseLength: 2000,
  })

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
      setSuccess("Your preferences updated successfully")
      setIsEditing(false)

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm("Reset all your preferences to defaults?")) return

    setIsSaving(true)
    setError("")

    try {
      const response = await apiClient.post("/preferences/reset")
      setSettings(response.data.preferences)
      setSuccess("Preferences reset to defaults")
      setIsEditing(false)

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Loading your preferences...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Your Personal Preferences</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Response Timeout */}
          <div className="border border-gray-200 rounded p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Response Timeout (seconds)</label>
            {isEditing ? (
              <input
                type="number"
                value={settings.responseTimeout}
                onChange={(e) => handleInputChange("responseTimeout", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="10"
                max="300"
              />
            ) : (
              <div className="text-lg font-semibold text-gray-800">{settings.responseTimeout}s</div>
            )}
          </div>

          {/* Context Window Size */}
          <div className="border border-gray-200 rounded p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Context Window (messages)</label>
            {isEditing ? (
              <input
                type="number"
                value={settings.contextWindowSize}
                onChange={(e) => handleInputChange("contextWindowSize", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="20"
              />
            ) : (
              <div className="text-lg font-semibold text-gray-800">{settings.contextWindowSize} messages</div>
            )}
          </div>

          {/* Max Response Length */}
          <div className="border border-gray-200 rounded p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Response Length (tokens)</label>
            {isEditing ? (
              <input
                type="number"
                value={settings.maxResponseLength}
                onChange={(e) => handleInputChange("maxResponseLength", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="500"
                max="8000"
              />
            ) : (
              <div className="text-lg font-semibold text-gray-800">{settings.maxResponseLength} tokens</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setIsEditing(false)
              loadSettings()
            }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-300 text-red-800 rounded-lg hover:bg-red-400 transition"
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  )
}
