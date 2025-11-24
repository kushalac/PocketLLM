const axios = require("axios")

class LLMService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/generate"
    this.model = process.env.OLLAMA_MODEL || "llama2:7b-chat"
  }

  async *streamResponse(prompt, systemPrompt = "") {
    try {
      const response = await axios.post(
        this.ollamaUrl,
        {
          model: this.model,
          prompt: prompt,
          stream: true,
          system: systemPrompt || "You are a helpful AI assistant.",
        },
        {
          responseType: "stream",
          timeout: 300000, // 5 minutes timeout
        },
      )

      for await (const chunk of response.data) {
        const lines = chunk
          .toString()
          .split("\n")
          .filter((l) => l.trim())
        for (const line of lines) {
          try {
            const json = JSON.parse(line)
            if (json.response) {
              yield json.response
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error) {
      console.error("Ollama streaming error:", error.message)
      throw new Error(`Failed to get response from Ollama: ${error.message}`)
    }
  }

  // Non-streaming response for storing in database
  async getResponse(prompt, systemPrompt = "") {
    try {
      let fullResponse = ""
      for await (const chunk of this.streamResponse(prompt, systemPrompt)) {
        fullResponse += chunk
      }
      return fullResponse
    } catch (error) {
      console.error("Ollama error:", error.message)
      throw error
    }
  }

  // Check if Ollama is available
  async isHealthy() {
    try {
      const base = this.ollamaUrl.replace("/api/generate", "")
      // Check if Ollama is running
      const healthUrl = `${base}/`
      await axios.get(healthUrl, { timeout: 5000 })
      
      // Check if the model is available
      const tagsUrl = `${base}/api/tags`
      const response = await axios.get(tagsUrl, { timeout: 5000 })
      
      // Verify our model exists
      if (response.data && response.data.models) {
        const hasModel = response.data.models.some(
          m => m.name === this.model || m.name.startsWith(this.model.split(':')[0])
        )
        return hasModel
      }
      
      return false
    } catch (error) {
      console.error("Ollama health check failed:", error.message)
      return false
    }
  }
}

module.exports = new LLMService()
