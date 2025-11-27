const { v4: uuidv4 } = require("uuid")
const Document = require("../models/Document")

// Common words to ignore when matching
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "must", "shall", "can", "need", "dare", "ought", "used",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into",
  "through", "during", "before", "after", "above", "below", "between",
  "and", "but", "or", "nor", "so", "yet", "both", "either", "neither",
  "not", "only", "own", "same", "than", "too", "very", "just", "also",
  "what", "which", "who", "whom", "this", "that", "these", "those",
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
  "he", "him", "his", "she", "her", "hers", "it", "its", "they", "them", "their",
  "am", "about", "tell", "give", "know", "think", "want", "like", "how", "when", "where", "why"
])

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
    return doc
  }

  async listDocuments(userId) {
    return Document.find({ user_id: userId }).sort({ created_at: -1 })
  }

  async deleteDocument(userId, documentId) {
    return Document.deleteOne({ _id: documentId, user_id: userId })
  }

  async searchDocuments(userId, query, limit = 3) {
    const docs = await Document.find({ user_id: userId })
    if (!docs.length) return []

    // Extract meaningful terms (filter stopwords and short words)
    const terms = (query || "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => term.replace(/[^a-z0-9-]/g, ""))
      .filter((term) => term.length > 2 && !STOPWORDS.has(term))

    // Need at least one meaningful term to search
    if (!terms.length) return []

    // Require at least 60% of meaningful terms to match (stricter threshold)
    const requiredMatches = Math.max(1, Math.ceil(terms.length * 0.6))
    const minConfidence = 0.5 // Minimum confidence score to include

    const scored = docs
      .map((doc) => {
        const contentLower = doc.content.toLowerCase()
        const titleLower = doc.title.toLowerCase()
        let score = 0
        let matchedTerms = []

        terms.forEach((term) => {
          // Title matches are worth more
          if (titleLower.includes(term)) {
            score += 2
            matchedTerms.push(term)
          } else if (contentLower.includes(term)) {
            score += 1
            matchedTerms.push(term)
          }
        })

        // No matches at all - skip
        if (score === 0) return null

        // Calculate confidence based on unique matched terms
        const uniqueMatched = [...new Set(matchedTerms)].length
        const confidence = uniqueMatched / terms.length

        // Skip if below minimum confidence
        if (confidence < minConfidence) return null

        // Build snippet around first match
        const idx = matchedTerms.reduce((acc, term) => {
          const i = contentLower.indexOf(term)
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
          confidence: Math.round(confidence * 100) / 100,
          score,
          uniqueMatched,
        }
      })
      .filter(Boolean)
      .filter((item) => item.uniqueMatched >= requiredMatches)
      .sort((a, b) => b.confidence - a.confidence || b.score - a.score)

    return scored.slice(0, limit).map(({ score, uniqueMatched, ...rest }) => rest)
  }
}

module.exports = new DocumentService()
