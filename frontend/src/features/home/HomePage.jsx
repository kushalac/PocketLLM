import { useNavigate } from "react-router-dom"
import { useState } from "react"
import AuthService from "../../core/AuthService"

export default function HomePage() {
  const navigate = useNavigate()
  const user = AuthService.getUser()
  const isAdmin = user?.is_admin === true
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await AuthService.logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">PocketLLM</h1>
        
        <div className="flex items-center gap-4">
          <span className="text-gray-700">
            {user?.username}
            {isAdmin && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>}
          </span>

          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Welcome to PocketLLM</h2>
          <p className="text-xl text-gray-600">A chat application with LLM integration</p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Real-time Chat</h3>
            <p className="text-gray-600">Chat with AI-powered responses powered by Llama 2</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Chat Sessions</h3>
            <p className="text-gray-600">Organize multiple conversations and manage your chat history</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Fast & Cached</h3>
            <p className="text-gray-600">Optimized with LRU cache and IndexedDB for better performance</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Secure</h3>
            <p className="text-gray-600">JWT-based authentication with secure session management</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Admin Dashboard</h3>
            <p className="text-gray-600">Monitor metrics, logs, and system performance</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Production Ready</h3>
            <p className="text-gray-600">Docker-ready full-stack application with MongoDB backend</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Start Chatting?</h3>
          <p className="text-gray-600 mb-6">Begin a new conversation or continue with your previous chats</p>
          <button
            onClick={() => navigate("/chat")}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-lg"
          >
            Go to Chat
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p>PocketLLM Portal v1.0.0</p>
          <p className="text-sm mt-2">Built with React, Node.js, MongoDB, and Ollama</p>
        </div>
      </main>
    </div>
  )
}
