import apiClient from "./ApiService"

class DocumentService {
  async list() {
    const res = await apiClient.get("/chat/documents")
    return res.data.documents || []
  }

  async create({ title, content, tags = [] }) {
    const res = await apiClient.post("/chat/documents", { title, content, tags })
    return res.data.document
  }

  delete(documentId) {
    return apiClient.delete(`/chat/documents/${documentId}`)
  }
}

export default new DocumentService()
