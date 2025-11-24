"use client"

import { useNavigate } from "react-router-dom"
import AuthService from "../../core/AuthService"

export default function ChatHeader({ onLogout }) {
  const navigate = useNavigate()
  const user = AuthService.getUser()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">PocketLLMs</h1>

      <div className="flex items-center gap-4">
        <span className="text-gray-700">{user?.username}</span>

        <button
          onClick={() => navigate("/admin")}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          Admin
        </button>

        <button onClick={onLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Logout
        </button>
      </div>
    </header>
  )
}
