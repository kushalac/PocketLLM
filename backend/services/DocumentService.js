const { v4: uuidv4 } = require("uuid")
const Document = require("../models/Document")
const CacheService = require("./CacheService")

class DocumentService {
  async createDocument(userId, { title, content, tags = [], source = "manual" }) {
    if (!title || !content) {
      throw new Error("Title and content are required")
    }

    const doc = new Document({
      _id: uuidv4(),
      user_id: userId,
      title,
      content,
      tags,
      source,
    })

    await doc.save()
    
    // Invalidate documents cache
    CacheService.delete(`documents:${userId}`)
    
    return doc
  }

  async listDocuments(userId) {
    const cacheKey = `documents:${userId}`
    const cached = CacheService.get(cacheKey)
    
    if (cached) {
      return cached
    }
    
    const documents = await Document.find({ user_id: userId }).sort({ created_at: -1 })
    CacheService.set(cacheKey, documents, 60000) // Cache for 60 seconds
    
    return documents
  }

  async deleteDocument(userId, documentId) {
    const result = await Document.deleteOne({ _id: documentId, user_id: userId })
    
    // Invalidate documents cache
    CacheService.delete(`documents:${userId}`)
    
    return result
  }

  async searchDocuments(userId, query, limit = 3) {
    const docs = await Document.find({ user_id: userId })
    if (!docs.length) return []

    const terms = (query || "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => term.replace(/[^a-z0-9-]/g, ""))
      .filter(Boolean)

    const requiredMatches = terms.length ? Math.max(1, Math.ceil(terms.length * 0.4)) : 0

    const scored = docs
      .map((doc) => {
        const contentLower = doc.content.toLowerCase()
        let score = 0
        terms.forEach((term) => {
          if (contentLower.includes(term)) score += 1
        })
        if (!terms.length) score = 1
        if (!terms.length && !doc.content) {
          return null
        }

        if (!terms.length || score > 0) {
          const idx = terms.reduce((acc, term) => {
            const i = term ? contentLower.indexOf(term) : -1
            if (i !== -1 && (acc === -1 || i < acc)) return i
            return acc
          }, -1)
          const snippetStart = idx === -1 ? 0 : Math.max(0, idx - 80)
          const snippetEnd = idx === -1 ? Math.min(200, doc.content.length) : Math.min(doc.content.length, idx + 120)
          const snippet = doc.content.slice(snippetStart, snippetEnd)

          return {
            documentId: doc._id,
            title: doc.title,
            snippet,
            source: doc.source,
            citation: doc.title,
            confidence: terms.length ? Math.min(1, score / terms.length) : 0.5,
            score,
          }
        }

        return null
      })
      .filter(Boolean)
      .filter((item) => {
        if (!terms.length) return true
        return item.score >= requiredMatches
      })
      .sort((a, b) => b.score - a.score)

    return scored.slice(0, limit).map(({ score, ...rest }) => rest)
  }
}

module.exports = new DocumentService()
