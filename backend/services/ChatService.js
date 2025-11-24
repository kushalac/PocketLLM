const { v4: uuidv4 } = require("uuid")
const ChatSession = require("../models/ChatSession")
const Message = require("../models/Message")

class ChatService {
  async createSession(userId, title = "New Chat") {
    const sessionId = uuidv4()

    const session = new ChatSession({
      _id: sessionId,
      user_id: userId,
      title,
    })
    await session.save()

    return sessionId
  }

  async getSessions(userId) {
    return await ChatSession.find({ user_id: userId }).sort({ updated_at: -1 })
  }

  async getSession(sessionId, userId) {
    return await ChatSession.findOne({ _id: sessionId, user_id: userId })
  }

  async renameSession(sessionId, userId, title) {
    const session = await this.getSession(sessionId, userId)
    if (!session) throw new Error("Session not found")

    session.title = title
    session.updated_at = new Date()
    await session.save()

    return { id: sessionId, title }
  }

  async deleteSession(sessionId, userId) {
    const session = await this.getSession(sessionId, userId)
    if (!session) throw new Error("Session not found")

    await Message.deleteMany({ session_id: sessionId })
    await ChatSession.deleteOne({ _id: sessionId })

    return true
  }

  async addMessage(sessionId, userId, role, content) {
    const messageId = uuidv4()

    const message = new Message({
      _id: messageId,
      session_id: sessionId,
      user_id: userId,
      role,
      content,
    })
    await message.save()

    await ChatSession.updateOne({ _id: sessionId }, { updated_at: new Date() })

    return messageId
  }

  async getMessages(sessionId, userId) {
    return await Message.find({
      session_id: sessionId,
      user_id: userId,
    }).sort({ created_at: 1 })
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
      },
      messages,
    }
  }
}

module.exports = new ChatService()
