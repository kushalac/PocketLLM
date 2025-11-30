const axios = require("axios")

class LLMService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/generate"
    this.model = process.env.OLLAMA_MODEL || "llama2:7b-chat"
  }

  async *streamResponse(prompt, options = {}) {
    const { systemPrompt = "You are a helpful AI assistant.", signal, timeout = 300000, contextWindowSize, maxResponseLength } = options
    try {
      // Build Ollama options from model settings
      const ollamaOptions = {}
      
      // contextWindowSize maps to num_ctx (context window in tokens)
      // Each message is roughly 50-100 tokens, so 8 messages = ~500-800 tokens context
      // We use a multiplier to ensure enough context
      if (contextWindowSize) {
        ollamaOptions.num_ctx = contextWindowSize * 128 // ~128 tokens per message average
      }
      
      // maxResponseLength maps to num_predict (max tokens to generate)
      if (maxResponseLength) {
        ollamaOptions.num_predict = Math.ceil(maxResponseLength / 4) // ~4 chars per token
      }

      const response = await axios.post(
        this.ollamaUrl,
        {
          model: this.model,
          prompt: prompt,
          stream: true,
          system: systemPrompt,
          ...(Object.keys(ollamaOptions).length > 0 && { options: ollamaOptions }),
        },
        {
          responseType: "stream",
          timeout: timeout, // Use configurable timeout (defaults to 5 minutes if not provided)
          signal,
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
      if (signal?.aborted) {
        throw new Error("Stream aborted by client")
      }
      console.error("Ollama streaming error:", error.message)
      throw new Error(`Failed to get response from Ollama: ${error.message}`)
    }
  }

  // Non-streaming response for storing in database
  async getResponse(prompt, systemPrompt = "") {
    try {
      let fullResponse = ""
      for await (const chunk of this.streamResponse(prompt, { systemPrompt })) {
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
