interface GroqAudioOptions {
  model?: string
  language?: string
  temperature?: number
}

interface TranscriptionResult {
  text: string
  language?: string
  duration?: number
}

interface TTSOptions {
  voice?: string
  speed?: number
  format?: string
}

class GroqAudioService {
  private apiKey: string | null = null
  private baseUrl = "https://api.groq.com/openai/v1"

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  async transcribeAudio(audioFile: File | Blob, options: GroqAudioOptions = {}): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error("Groq API key not provided")
    }

    const formData = new FormData()
    formData.append("file", audioFile)
    formData.append("model", options.model || "whisper-large-v3")

    if (options.language) {
      formData.append("language", options.language)
    }

    if (options.temperature !== undefined) {
      formData.append("temperature", options.temperature.toString())
    }

    try {
      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(error.error?.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      return {
        text: result.text,
        language: result.language,
        duration: result.duration,
      }
    } catch (error) {
      console.error("Groq transcription error:", error)
      throw error
    }
  }

  async translateAudio(audioFile: File | Blob, options: GroqAudioOptions = {}): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error("Groq API key not provided")
    }

    const formData = new FormData()
    formData.append("file", audioFile)
    formData.append("model", options.model || "whisper-large-v3")

    if (options.temperature !== undefined) {
      formData.append("temperature", options.temperature.toString())
    }

    try {
      const response = await fetch(`${this.baseUrl}/audio/translations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(error.error?.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      return {
        text: result.text,
        language: "en", // Translations are always to English
        duration: result.duration,
      }
    } catch (error) {
      console.error("Groq translation error:", error)
      throw error
    }
  }

  // Get available Whisper models
  getAvailableModels(): { id: string; name: string; description: string }[] {
    return [
      {
        id: "whisper-large-v3",
        name: "Whisper Large V3",
        description: "Most accurate, slower processing",
      },
      {
        id: "whisper-large-v3-turbo",
        name: "Whisper Large V3 Turbo",
        description: "Fast and accurate, recommended",
      },
    ]
  }

  // Get supported languages for transcription
  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: "auto", name: "Auto-detect" },
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "it", name: "Italian" },
      { code: "pt", name: "Portuguese" },
      { code: "ru", name: "Russian" },
      { code: "ja", name: "Japanese" },
      { code: "ko", name: "Korean" },
      { code: "zh", name: "Chinese" },
      { code: "ar", name: "Arabic" },
      { code: "hi", name: "Hindi" },
      { code: "tr", name: "Turkish" },
      { code: "pl", name: "Polish" },
      { code: "nl", name: "Dutch" },
    ]
  }

  // Create audio blob from recorded data
  createAudioBlob(audioData: Blob, mimeType = "audio/webm"): Blob {
    return new Blob([audioData], { type: mimeType })
  }

  // Convert audio blob to different format (basic conversion)
  async convertAudioFormat(audioBlob: Blob, targetFormat = "audio/wav"): Promise<Blob> {
    // This is a basic implementation. For production, you might want to use a more robust audio conversion library
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      audio.onloadeddata = () => {
        // Basic conversion logic would go here
        // For now, just return the original blob
        resolve(audioBlob)
      }

      audio.onerror = () => {
        reject(new Error("Audio conversion failed"))
      }

      audio.src = URL.createObjectURL(audioBlob)
    })
  }
}

export const groqAudio = new GroqAudioService()
