import { useEffect, useRef, useState } from "react"
import DocumentService from "../../core/DocumentService"

const Modal = ({ open, onClose, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden mx-4">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Knowledge Base</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  )
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

const DocumentCard = ({ doc, onDelete }) => (
  <div className="border border-gray-200 rounded-xl p-4 space-y-2 hover:border-gray-300 transition group">
    <div className="flex justify-between items-start gap-3">
      <div className="min-w-0 flex-1">
        <h4 className="text-base font-semibold text-gray-900 truncate">{doc.title}</h4>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatRelativeTime(doc.created_at)}
        </p>
      </div>
      <button
        onClick={() => onDelete(doc)}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        title="Delete document"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
    <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-2">{doc.content}</p>
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span>{doc.content?.length || 0} characters</span>
    </div>
  </div>
)

export default function DocsPanel({ open, onClose }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ title: "", content: "" })
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const docs = await DocumentService.list()
      setDocuments(docs)
      setError("")
    } catch (err) {
      setError("Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadDocuments()
    }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await DocumentService.create(form)
      setForm({ title: "", content: "" })
      await loadDocuments()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload document")
    } finally {
      setSaving(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file) => {
    setError("")
    if (!file.type.startsWith("text") && !/\.(md|txt|json)$/i.test(file.name)) {
      setError("Only plain-text or markdown files are supported")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const baseTitle = file.name.replace(/\.[^.]+$/, "")
      setForm((prev) => ({
        title: prev.title || baseTitle,
        content: typeof reader.result === "string" ? reader.result : prev.content,
      }))
    }
    reader.onerror = () => {
      setError("Unable to read file contents")
    }
    reader.readAsText(file)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
    event.target.value = ""
  }

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete document "${doc.title}"?`)) return
    try {
      await DocumentService.delete(doc._id)
      await loadDocuments()
    } catch (err) {
      setError("Failed to delete document")
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600">Upload short passages or notes that PocketLLM can cite in responses.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`space-y-4 border-2 border-dashed rounded-xl p-5 transition ${
            dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".txt,.md,.json,text/plain,text/markdown"
            className="hidden"
            onChange={handleFileUpload}
          />

          {dragActive ? (
            <div className="text-center py-4">
              <svg className="w-10 h-10 mx-auto text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-blue-600 font-medium">Drop file here</p>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import file
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Document title"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Content</label>
                <textarea
                  required
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-none"
                  placeholder="Paste your text content here..."
                />
                <p className="text-xs text-gray-400 mt-1">{form.content.length} characters</p>
              </div>
              <button
                type="submit"
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Document
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Drag & drop a .txt or .md file, or paste text directly
              </p>
            </>
          )}
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-gray-900">Your Documents</h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{documents.length} total</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/4 mb-3"></div>
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No documents yet</p>
              <p className="text-xs mt-1">Add your first document above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard key={doc._id} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
