import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import ChatSessionService from "../../core/ChatSessionService"

const formatDate = (value) => {
  if (!value) return "Unknown"
  return new Date(value).toLocaleString()
}

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ""
  const now = Date.now()
  const date = new Date(timestamp)
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

const SkeletonCard = () => (
  <div className="border border-gray-200 rounded-xl p-4 bg-white animate-pulse">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
      <div className="h-5 bg-gray-100 rounded-full w-16"></div>
    </div>
    <div className="h-3 bg-gray-100 rounded w-2/3 mb-4"></div>
    <div className="flex gap-2">
      <div className="h-9 bg-gray-200 rounded-lg flex-1"></div>
      <div className="h-9 bg-gray-100 rounded-lg w-20"></div>
      <div className="h-9 bg-gray-100 rounded-lg w-20"></div>
    </div>
  </div>
)

const HistoryCard = ({ session, onResume, onExport, onDelete }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate" title={session.title}>
            {session.title || "Untitled Chat"}
          </h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatRelativeTime(session.updated_at)}
          </p>
        </div>
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 flex-shrink-0">
          {session.message_count} msg{session.message_count !== 1 ? "s" : ""}
        </span>
      </div>

      <p className="text-xs text-gray-400">
        Created {formatDate(session.created_at)}
      </p>

      <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-gray-100">
        <button
          onClick={() => onResume(session)}
          className="flex-1 min-w-[100px] px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Resume
        </button>
        <button
          onClick={() => onExport(session)}
          className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
        <button
          onClick={() => onDelete(session)}
          className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1.5 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
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
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/chat")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Chat
          </button>
          <button
            onClick={loadSessions}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center border border-dashed border-gray-300 rounded-xl py-16 bg-gray-50/50">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-lg font-semibold text-gray-600 mb-2">No conversations yet</p>
            <p className="text-gray-500 mb-4">Start a chat and it will show up here automatically.</p>
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
