const { v4: uuidv4 } = require("uuid")
const natural = require("natural")
const Document = require("../models/Document")


const TfIdf = natural.TfIdf
const tokenizer = new natural.WordTokenizer()
const stemmer = natural.PorterStemmer

// Stopwords for English
const stopwords = new Set(natural.stopwords)


const extraStopwords = new Set([
  "tell", "give", "know", "think", "want", "like", "please", "thanks",
  "help", "need", "would", "could", "should", "can", "may", "might"
])

/**
 * Tokenize and stem text, removing stopwords
 */
function extractTerms(text) {
  return tokenizer
    .tokenize(text.toLowerCase())
    .filter((word) => word.length > 2)
    .filter((word) => !stopwords.has(word) && !extraStopwords.has(word))
    .map((word) => stemmer.stem(word))
}

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

    // Extract meaningful terms from query (stemmed, no stopwords)
    const queryTerms = extractTerms(query || "")
    if (!queryTerms.length) return []

    // Build TF-IDF index (create new for each search(embedding))
    const tfidf = new TfIdf()
    docs.forEach((doc) => {
      tfidf.addDocument(`${doc.title} ${doc.title} ${doc.content}`) // Title weighted 2x
    })

    // Score each document (based on query terms)
    const scored = []
    const minScore = 0.3 // Minimum TF-IDF score threshold

    docs.forEach((doc, idx) => {
      let totalScore = 0
      let matchedTerms = []

      // Get TF-IDF score for each query term
      queryTerms.forEach((term) => {
        const termScore = tfidf.tfidf(term, idx)
        if (termScore > 0) {
          totalScore += termScore
          matchedTerms.push(term)
        }
      })

      // Normalize score by number of query terms
      const normalizedScore = totalScore / queryTerms.length

      // Skip low relevance
      if (normalizedScore < minScore || matchedTerms.length === 0) return

      // Calculate confidence (what % of query terms matched)
      const confidence = matchedTerms.length / queryTerms.length

      // Need at least 50% of terms to match
      if (confidence < 0.5) return


      const contentLower = doc.content.toLowerCase()
      const firstMatch = matchedTerms[0]
      const idx_match = contentLower.indexOf(stemmer.stem(firstMatch)) 
      const snippetStart = idx_match === -1 ? 0 : Math.max(0, idx_match - 80)
      const snippetEnd = idx_match === -1 ? Math.min(200, doc.content.length) : Math.min(doc.content.length, idx_match + 120)
      const snippet = doc.content.slice(snippetStart, snippetEnd)

      scored.push({
        documentId: doc._id,
        title: doc.title,
        snippet,
        source: doc.source,
        citation: doc.title,
        confidence: Math.round(confidence * 100) / 100,
        score: normalizedScore,
      })
    })

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)

    return scored.slice(0, limit).map(({ score, ...rest }) => rest)
  }
}

module.exports = new DocumentService()
