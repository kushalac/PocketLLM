const { v4: uuidv4 } = require("uuid")
const ChatSession = require("../models/ChatSession")
const Message = require("../models/Message")
const CacheService = require("./CacheService")

const DEFAULT_TITLE = "New Chat"

const buildTitleFromContent = (content = "") => {
  const cleaned = content.replace(/\s+/g, " ").trim()
  if (!cleaned) return null
  const words = cleaned.split(" ").slice(0, 8)
  let draft = words.join(" ")
  if (draft.length > 60) {
    draft = `${draft.slice(0, 57)}...`
  }
  return draft
}

class ChatService {
  async createSession(userId, title = DEFAULT_TITLE) {
    const sessionId = uuidv4()

    const session = new ChatSession({
      _id: sessionId,
      user_id: userId,
      title,
      message_count: 0,
      title_locked: false,
    })
    await session.save()

    return sessionId
  }

  async getSessions(userId) {
    const cacheKey = `sessions:${userId}`
    const cached = CacheService.get(cacheKey)
    
    if (cached) {
      return cached
    }
    
    const sessions = await ChatSession.find({ user_id: userId }).sort({ updated_at: -1 })
    CacheService.set(cacheKey, sessions, 30000) // Cache for 30 seconds
    
    return sessions
  }

  async getSession(sessionId, userId) {
    const cacheKey = `session:${sessionId}:${userId}`
    const cached = CacheService.get(cacheKey)
    
    if (cached) {
      return cached
    }
    
    const session = await ChatSession.findOne({ _id: sessionId, user_id: userId })
    if (session) {
      CacheService.set(cacheKey, session, 60000) // Cache for 60 seconds
    }
    
    return session
  }

  async renameSession(sessionId, userId, title) {
    const session = await this.getSession(sessionId, userId)
    if (!session) throw new Error("Session not found")

    session.title = title
    session.title_locked = true
    session.updated_at = new Date()
    await session.save()

    // Invalidate cache
    CacheService.delete(`session:${sessionId}:${userId}`)
    CacheService.delete(`sessions:${userId}`)
    CacheService.delete(`messages:${sessionId}`)

    return { id: sessionId, title }
  }

  async deleteSession(sessionId, userId) {
    const session = await this.getSession(sessionId, userId)
    if (!session) throw new Error("Session not found")

    await Message.deleteMany({ session_id: sessionId })
    await ChatSession.deleteOne({ _id: sessionId })

    // Invalidate cache
    CacheService.delete(`session:${sessionId}:${userId}`)
    CacheService.delete(`sessions:${userId}`)
    CacheService.delete(`messages:${sessionId}`)

    return true
  }

  async addMessage(sessionId, userId, role, content, metadata = {}) {
    const session = await this.getSession(sessionId, userId)
    if (!session) {
      throw new Error("Session not found")
    }

    const messageId = uuidv4()
    const evidencePayload = "evidence" in metadata ? { evidence: metadata.evidence } : {}
    const statusPayload = metadata.status ? { status: metadata.status } : {}
    const metaPayload = metadata.meta ? { meta: metadata.meta } : {}

    const message = new Message({
      _id: messageId,
      session_id: sessionId,
      user_id: userId,
      role,
      content,
      ...evidencePayload,
      ...statusPayload,
      ...metaPayload,
    })
    await message.save()

    session.updated_at = new Date()
    session.message_count = (session.message_count || 0) + 1

    if (role === "user" && !session.title_locked) {
      const generatedTitle = buildTitleFromContent(content)
      if (generatedTitle && (session.message_count <= 1 || session.title === DEFAULT_TITLE)) {
        session.title = generatedTitle
      }
    }

    await session.save()

    // Invalidate cache since session and messages changed
    CacheService.delete(`session:${sessionId}:${userId}`)
    CacheService.delete(`sessions:${userId}`)
    CacheService.delete(`messages:${sessionId}`)

    return messageId
  }

  async getMessages(sessionId, userId) {
    const cacheKey = `messages:${sessionId}`
    const cached = CacheService.get(cacheKey)
    
    if (cached) {
      return cached
    }
    
    // CRITICAL: This ensures messages are ONLY returned for the specific session
    const messages = await Message.find({
      session_id: sessionId,
      user_id: userId,
    }).sort({ created_at: 1 })

    CacheService.set(cacheKey, messages, 45000) // Cache for 45 seconds

    return messages
  }

  async getConversationContext(sessionId, userId, limit = 8) {
   
    const messages = await Message.find({
      session_id: sessionId,
      user_id: userId,
    })
      .sort({ created_at: -1 })
      .limit(limit)

    return messages.reverse()
  }

  async getRecentUserSnippets(sessionId, userId, limit = 2) {
  
    const messages = await Message.find({
      session_id: sessionId,
      user_id: userId,
      role: "user",
    })
      .sort({ created_at: -1 })
      .limit(limit)

    return messages.map((msg, idx) => ({
      source: "Conversation",
      snippet: msg.content.slice(0, 200),
      citation: `message#${msg._id || idx}`,
      confidence: 0.3,
    }))
  }

  async exportSession(sessionId, userId) {
    const session = await this.getSession(sessionId, userId)
    if (!session) throw new Error("Session not found")

    const messages = await this.getMessages(sessionId, userId)

    return {
      session: {
        id: session._id,
        title: session.title,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        messageCount: session.message_count ?? 0,
      },
      messages,
    }
  }

  // Clear all messages from a session
  async clearSessionMessages(sessionId, userId) {
    const session = await this.getSession(sessionId, userId)
    if (!session) throw new Error("Session not found")

    await Message.deleteMany({ 
      session_id: sessionId,
      user_id: userId 
    })

    session.message_count = 0
    session.updated_at = new Date()
    await session.save()

    return true
  }

  async verifySessionIsolation(sessionId, userId) {
    const messages = await this.getMessages(sessionId, userId)
    const allMessages = await Message.find({ user_id: userId })
    
    return {
      sessionId,
      messagesInSession: messages.length,
      totalMessages: allMessages.length,
      otherSessionMessages: allMessages.length - messages.length,
      isIsolated: messages.every(msg => msg.session_id === sessionId)
    }
  }

  async deleteMessage(sessionId, messageId, userId) {
    // Verify the message belongs to this session and user
    const message = await Message.findOne({ 
      _id: messageId, 
      session_id: sessionId, 
      user_id: userId 
    })
    
    if (!message) {
      throw new Error("Message not found")
    }

    // Delete the message
    await Message.deleteOne({ _id: messageId })

    // Update session message count and timestamp
    const session = await ChatSession.findOne({ _id: sessionId, user_id: userId })
    if (session) {
      session.message_count = Math.max(0, (session.message_count || 1) - 1)
      session.updated_at = new Date()
      await session.save()
    }

    // Invalidate cache
    CacheService.delete(`session:${sessionId}:${userId}`)
    CacheService.delete(`sessions:${userId}`)
    CacheService.delete(`messages:${sessionId}`)

    return true
  }
}

module.exports = new ChatService()