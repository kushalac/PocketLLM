"use client"

import { useEffect, useRef, useState } from "react"

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

export default function MessageList({ messages, loading }) {
  const endRef = useRef(null)
  const [annotations, setAnnotations] = useState({})
  const [collapsedEvidence, setCollapsedEvidence] = useState({})

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const toggleEvidence = (messageId) => {
    setCollapsedEvidence((prev) => ({ ...prev, [messageId]: !prev[messageId] }))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm mt-1">Send a message to start the conversation</p>
        </div>
      ) : (
        <>
          {messages.map((message, idx) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} group`}>
              <div
                className={`max-w-lg px-4 py-2 rounded-2xl shadow-sm ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                }`}
              >
                <p className="text-sm break-words whitespace-pre-line leading-relaxed">{message.content}</p>

                {message.status === "aborted" && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Response stopped</span>
                  </div>
                )}

                {message.timestamp && (
                  <p className={`text-[10px] mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                    message.role === "user" ? "text-blue-200" : "text-gray-400"
                  }`}>
                    {formatRelativeTime(message.timestamp)}
                  </p>
                )}

                {message.role === "assistant" && message.evidence && message.evidence.length > 0 && (
                  (() => {
                    const docEvidence = message.evidence.filter(
                      (item) => item.source && item.source !== "Conversation",
                    )
                    if (!docEvidence.length) return null

                    const handleToggle = (key, label) => {
                      setAnnotations((prev) => {
                        const current = prev[key]
                        const next = current === label ? null : label
                        return { ...prev, [key]: next }
                      })
                    }

                    const isCollapsed = collapsedEvidence[message.id]

                    return (
                      <div className="mt-3 space-y-2 border-t border-gray-200 pt-2">
                        <button
                          type="button"
                          onClick={() => toggleEvidence(message.id)}
                          className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 hover:text-gray-700 transition"
                        >
                          <svg
                            className={`w-3 h-3 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>{docEvidence.length} source{docEvidence.length > 1 ? "s" : ""} cited</span>
                        </button>
                        {!isCollapsed && docEvidence.map((item, index) => {
                          const key = `${message.id}-evidence-${index}`
                          const status = annotations[key]
                          return (
                            <div key={key} className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-700 space-y-1.5 border border-gray-100">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-gray-800">
                                  {item.citation || item.title || item.source}
                                </p>
                                {item.confidence && (
                                  <span className="text-[10px] text-gray-500">
                                    {(item.confidence * 100).toFixed(0)}% match
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600">{item.snippet}</p>
                              <div className="flex gap-2 text-[11px] text-gray-500">
                                <button
                                  type="button"
                                  onClick={() => handleToggle(key, "liked")}
                                  className={`px-2 py-0.5 rounded border ${
                                    status === "liked"
                                      ? "border-blue-500 text-blue-600 bg-blue-50"
                                      : "border-gray-300 hover:border-blue-400"
                                  }`}
                                >
                                  {status === "liked" ? "Liked" : "Like"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggle(key, "refer")}
                                  className={`px-2 py-0.5 rounded border ${
                                    status === "refer"
                                      ? "border-green-500 text-green-600 bg-green-50"
                                      : "border-gray-300 hover:border-green-400"
                                  }`}
                                >
                                  {status === "refer" ? "Referred" : "Mark as reference"}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 text-gray-600 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400 ml-1">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </>
      )}
    </div>
  )
}
