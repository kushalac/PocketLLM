"use client"

export default function ChatItem({ session, isActive, onSelect, onRename, onDelete }) {
  return (
    <div
      onClick={onSelect}
      className={`p-3 cursor-pointer transition flex justify-between items-center group ${
        isActive ? "bg-blue-50 border-l-4 border-blue-600" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex-1 truncate">
        <p className={`text-sm truncate ${isActive ? "font-semibold text-blue-600" : "text-gray-700"}`}>
          {session.title}
        </p>
        <p className="text-xs text-gray-500">{new Date(session.created_at).toLocaleDateString()}</p>
      </div>

      <div className="hidden group-hover:flex gap-2 ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRename()
          }}
          className="p-1 hover:bg-gray-200 rounded"
          title="Rename"
        >
          ✎
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1 hover:bg-red-100 rounded text-red-600"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
