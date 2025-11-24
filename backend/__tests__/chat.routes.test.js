const request = require("supertest")
const express = require("express")
const chatRoutes = require("../routes/chat")
const { initDB } = require("../db/connection")

describe("Chat Routes", () => {
  let app
  let token

  beforeAll(async () => {
    await initDB()
    app = express()
    app.use(express.json())
    app.use("/api/chat", chatRoutes)
  })

  test("should start a new chat session", async () => {
    const res = await request(app).post("/api/chat/start").set("Authorization", `Bearer ${token}`).expect(200)

    expect(res.body.sessionId).toBeDefined()
  })
})
