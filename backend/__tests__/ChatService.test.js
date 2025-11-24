const ChatService = require("../services/ChatService")
const { initDB } = require("../db/connection")

describe("ChatService", () => {
  beforeAll(async () => {
    await initDB()
  })

  test("should create a new session", async () => {
    const sessionId = await ChatService.createSession(1, "Test Chat")
    expect(sessionId).toBeDefined()
  })

  test("should add a message to session", async () => {
    const sessionId = await ChatService.createSession(1, "Test Chat")
    const messageId = await ChatService.addMessage(sessionId, 1, "user", "Hello")
    expect(messageId).toBeDefined()
  })

  test("should get session messages", async () => {
    const sessionId = await ChatService.createSession(1, "Test Chat")
    await ChatService.addMessage(sessionId, 1, "user", "Hello")
    const messages = await ChatService.getMessages(sessionId, 1)
    expect(messages.length).toBe(1)
    expect(messages[0].content).toBe("Hello")
  })

  test("should rename session", async () => {
    const sessionId = await ChatService.createSession(1, "Test Chat")
    const result = await ChatService.renameSession(sessionId, 1, "New Title")
    expect(result.title).toBe("New Title")
  })
})
