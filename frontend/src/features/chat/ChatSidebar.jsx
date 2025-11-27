"use client"

import { useState } from "react"
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

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          disabled={isCreatingSession}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreatingSession ? "Creating..." : "+ New Chat"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.map((session) => (
          <div key={session.id} className="border-b border-gray-100">
            {renamingId === session.id ? (
              <div className="p-3 flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveRename(session.id)}
                  className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setRenamingId(null)}
                  className="px-2 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
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
        ))}
      </div>
    </div>
  )
}
