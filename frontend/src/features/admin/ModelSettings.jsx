"use client"

import { useState, useEffect } from "react"
import apiClient from "../../core/ApiService"

export default function ModelSettings({ onSettingsUpdated }) {
  const [settings, setSettings] = useState({
    contextWindowSize: 8,
    maxResponseLength: 2000,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load current settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await apiClient.get("/admin/model-settings")
      setSettings(response.data.settings)
    } catch (err) {
      console.error("Failed to load model settings:", err)
      setError("Failed to load current model settings from server")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: field.includes("enable") ? value : parseFloat(value) || value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await apiClient.post("/admin/model-settings", settings)
      setSuccess(`✓ Model settings updated successfully (${Object.keys(response.data.changes).length} fields changed)`)
      setIsEditing(false)
      onSettingsUpdated?.()
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update model settings")
      console.error("Settings update error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError("")
    loadSettings() // Reload from server to discard changes
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">Loading model settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Global Model Settings</h2>
          <p className="text-sm text-gray-500 mt-1">These settings apply to all users across the system</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
          >
            ✎ Edit Settings
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex items-start">
          <span className="mr-2">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm flex items-start">
          <span className="mr-2">{success}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Context Window Size */}
        <div className="border border-gray-200 rounded p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Context Window Size
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Number of previous messages to include as context for LLM
          </p>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Response Length (tokens)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Maximum length of LLM response (approximately 4 chars per token)
          </p>
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
            <div className="text-lg font-semibold text-gray-800">{settings.maxResponseLength} tokens (~{(settings.maxResponseLength * 4).toLocaleString()} chars)</div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
          >
            {isSaving ? "⏳ Saving..." : "✓ Save & Apply"}
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
