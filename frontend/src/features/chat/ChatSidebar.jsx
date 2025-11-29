"use client"

import { useState, useMemo } from "react"
import ChatItem from "../../components/ChatItem"

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  isCreatingSession = false,
}) {
  const [renamingId, setRenamingId] = useState(null)
  const [newTitle, setNewTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    return sessions.filter((s) =>
      s.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [sessions, searchQuery])

  const handleStartRename = (session) => {
    setRenamingId(session.id)
    setNewTitle(session.title)
  }

  const handleSaveRename = (sessionId) => {
    if (newTitle.trim()) {
      onRenameSession(sessionId, newTitle)
    }
    setRenamingId(null)
  }

  const handleKeyDown = (e, sessionId) => {
    if (e.key === "Enter") {
      handleSaveRename(sessionId)
    } else if (e.key === "Escape") {
      setRenamingId(null)
    }
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-3 space-y-3 border-b border-gray-200">
        <button
          onClick={onNewChat}
          disabled={isCreatingSession}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {isCreatingSession ? "Creating..." : "New Chat"}
        </button>

        {sessions.length > 3 && (
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
            />
          </div>
        )}
      </div>

      <div className="px-3 py-2 flex items-center justify-between text-xs text-gray-500">
        <span>Recent chats</span>
        <span>{filteredSessions.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400">
            {searchQuery ? (
              <>
                <p className="text-sm">No matches found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">No chats yet</p>
                <p className="text-xs mt-1">Click "New Chat" to start</p>
              </>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div key={session.id} className="border-b border-gray-100 last:border-b-0">
              {renamingId === session.id ? (
                <div className="p-3 space-y-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, session.id)}
                    className="w-full px-2 py-1.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200"
                    autoFocus
                    placeholder="Enter title..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveRename(session.id)}
                      className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <ChatItem
                  session={session}
                  isActive={activeSessionId === session.id}
                  onSelect={() => onSelectSession(session.id)}
                  onRename={() => handleStartRename(session)}
                  onDelete={() => onDeleteSession(session.id)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
