import { useEffect, useRef, useState } from "react"
import DocumentService from "../../core/DocumentService"

const Modal = ({ open, onClose, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-end border-b border-gray-200 p-3">
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            Close ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  )
}

const DocumentCard = ({ doc, onDelete }) => (
  <div className="border border-gray-200 rounded-lg p-4 space-y-2">
    <div className="flex justify-between items-start gap-3">
      <div>
        <h4 className="text-lg font-semibold text-gray-900">{doc.title}</h4>
        <p className="text-xs text-gray-500">Uploaded {new Date(doc.created_at).toLocaleString()}</p>
      </div>
      <button onClick={() => onDelete(doc)} className="text-sm text-red-600 hover:underline">
        Delete
      </button>
    </div>
    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{doc.content}</p>
  </div>
)

export default function DocsPanel({ open, onClose }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ title: "", content: "" })
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
      await DocumentService.create(form)
      setForm({ title: "", content: "" })
      await loadDocuments()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload document")
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError("")
    if (!file.type.startsWith("text") && !/\.(md|txt|json)$/i.test(file.name)) {
      setError("Only plain-text or markdown files are supported")
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const baseTitle = file.name.replace(/\.[^.]+$/, "")
      setForm((prev) => ({
        title: prev.title || baseTitle,
        content: typeof reader.result === "string" ? reader.result : prev.content,
      }))
      event.target.value = ""
    }
    reader.onerror = () => {
      setError("Unable to read file contents")
      event.target.value = ""
    }
    reader.readAsText(file)
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
          <h3 className="text-2xl font-bold text-gray-900">Knowledge Base</h3>
          <p className="text-sm text-gray-600">Upload short passages or paste notes that PocketLLM can cite.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3 border border-dashed border-gray-300 rounded-lg p-4">
          <input
            type="file"
            ref={fileInputRef}
            accept=".txt,.md,.json,text/plain,text/markdown"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-blue-600 hover:underline"
              >
                Import from file
              </button>
            </div>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Content</label>
            <textarea
              required
              rows={5}
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200"
              placeholder="Paste up to a few paragraphs of text"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Document"}
          </button>
          <p className="text-xs text-gray-500 text-center">
            Tip: Paste text directly or use “Import from file” for .txt/.md excerpts.
          </p>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Uploaded Documents</h4>
            <span className="text-sm text-gray-500">{documents.length} total</span>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="text-gray-500">No documents yet. Add one above.</p>
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
