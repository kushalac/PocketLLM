"use client"

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

export default function ChatItem({ session, isActive, onSelect, onRename, onDelete }) {
  const preview = session.lastMessage || session.preview || ""
  const truncatedPreview = preview.length > 40 ? preview.slice(0, 40) + "..." : preview

  return (
    <div
      onClick={onSelect}
      className={`p-3 cursor-pointer transition flex justify-between items-start group ${
        isActive
          ? "bg-blue-50 border-l-4 border-blue-600"
          : "hover:bg-gray-50 border-l-4 border-transparent"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${isActive ? "font-semibold text-blue-700" : "text-gray-800"}`}>
            {session.title || "New Chat"}
          </p>
          {session.message_count > 0 && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
              {session.message_count}
            </span>
          )}
        </div>
        {truncatedPreview && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{truncatedPreview}</p>
        )}
        <p className="text-[10px] text-gray-400 mt-1">
          {formatRelativeTime(session.updated_at || session.created_at)}
        </p>
      </div>

      <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-2 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRename()
          }}
          className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700 transition"
          title="Rename"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1.5 hover:bg-red-100 rounded-md text-gray-500 hover:text-red-600 transition"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
