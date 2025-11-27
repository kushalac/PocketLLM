"use client"

import { useEffect, useRef, useState } from "react"

export default function MessageList({ messages, loading }) {
  const endRef = useRef(null)
  const [annotations, setAnnotations] = useState({})

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500">
          <p>Start a conversation</p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-lg px-4 py-2 rounded-lg ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                <p className="text-sm break-words whitespace-pre-line">{message.content}</p>

                {message.status === "aborted" && (
                  <p className="text-xs text-amber-700 mt-2 italic">Response stopped before completion.</p>
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

                    return (
                      <div className="mt-3 space-y-2 border-t border-gray-300 pt-2">
                        <p className="text-xs uppercase tracking-wide text-gray-600">Referenced documents</p>
                        {docEvidence.map((item, index) => {
                          const key = `${message.id}-evidence-${index}`
                          const status = annotations[key]
                          return (
                            <div key={key} className="bg-white/70 rounded-md p-2 text-xs text-gray-700 space-y-1">
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
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
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
