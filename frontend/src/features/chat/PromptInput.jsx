"use client"

import { useState, useRef, useEffect } from "react"

const MAX_LENGTH = 4000

export default function PromptInput({ onSubmit, disabled, onStop, isStreaming }) {
  const [input, setInput] = useState("")
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px"
    }
  }, [input])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSubmit(input)
      setInput("")
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const charCount = input.length
  const isNearLimit = charCount > MAX_LENGTH * 0.9
  const isOverLimit = charCount > MAX_LENGTH

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH + 100))}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none text-sm leading-relaxed"
          />
          <div className="absolute right-3 bottom-1.5 flex items-center gap-2 text-[10px] text-gray-400">
            {!isStreaming && (
              <span className="hidden sm:inline">⏎ to send</span>
            )}
            <span className={isOverLimit ? "text-red-500" : isNearLimit ? "text-amber-500" : ""}>
              {charCount > 0 && `${charCount}/${MAX_LENGTH}`}
            </span>
          </div>
        </div>
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !input.trim() || isOverLimit}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        )}
      </div>
    </form>
  )
}
