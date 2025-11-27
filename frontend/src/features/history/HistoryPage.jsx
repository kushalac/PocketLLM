import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import ChatSessionService from "../../core/ChatSessionService"

const formatDate = (value) => {
  if (!value) return "Unknown"
  return new Date(value).toLocaleString()
}

const HistoryCard = ({ session, onResume, onExport, onDelete }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 truncate" title={session.title}>
            {session.title || "Untitled Chat"}
          </h3>
          <p className="text-sm text-gray-500">Last updated {formatDate(session.updated_at)}</p>
        </div>
        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
          {session.message_count} messages
        </span>
      </div>

      <p className="text-sm text-gray-600 truncate">
        Created {formatDate(session.created_at)}
      </p>

      <div className="flex flex-wrap gap-2 mt-auto">
        <button
          onClick={() => onResume(session)}
          className="flex-1 min-w-[120px] px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          Resume
        </button>
        <button
          onClick={() => onExport(session)}
          className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Export
        </button>
        <button
          onClick={() => onDelete(session)}
          className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadSessions = async (forceRefresh = false) => {
    try {
      setLoading(true)
      // Load from cache first for fast display
      const data = await ChatSessionService.getSessions(forceRefresh)
      setSessions(data)
    } catch (err) {
      console.error(err)
      setError("Failed to load session history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load from cache immediately, then refresh in background
    loadSessions(false)
  }, [])

  const filteredSessions = useMemo(() => {
    if (!query.trim()) return sessions
    return sessions.filter((session) => session.title.toLowerCase().includes(query.trim().toLowerCase()))
  }, [sessions, query])

  const handleResume = (session) => {
    navigate(`/chat?session=${session.id}`)
  }

  const handleExport = async (session) => {
    try {
      const { blob, filename } = await ChatSessionService.downloadSession(session.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      setError("Failed to export chat")
    }
  }

  const handleDelete = async (session) => {
    if (!window.confirm(`Delete "${session.title}"? This cannot be undone.`)) {
      return
    }
    try {
      await ChatSessionService.deleteSession(session.id)
      await loadSessions(true)
    } catch (err) {
      console.error(err)
      setError("Failed to delete chat")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">History</p>
          <h1 className="text-2xl font-bold text-gray-900">Conversation Archive</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/chat")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back to Chat
          </button>
          <button
            onClick={loadSessions}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <input
            type="search"
            placeholder="Search by title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
          <span className="text-sm text-gray-600">{filteredSessions.length} sessions</span>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">{error}</div>}

        {loading ? (
          <div className="text-center text-gray-500">Loading sessions…</div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center text-gray-500 border border-dashed border-gray-300 rounded-xl py-16">
            <p className="text-lg font-semibold mb-2">No conversations yet</p>
            <p className="mb-4">Start a chat and it will show up here automatically.</p>
            <button
              onClick={() => navigate("/chat")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start chatting
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSessions.map((session) => (
              <HistoryCard
                key={session.id}
                session={session}
                onResume={handleResume}
                onExport={handleExport}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
