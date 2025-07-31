interface RecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  maxAlternatives?: number
}

type TranscriptCallback = (transcript: string, isFinal: boolean) => void
type ErrorCallback = (error: string) => void

class SpeechRecognitionService {
  private recognition: any = null
  private isListening = false

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.setupRecognition()
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = "en-US"
    this.recognition.maxAlternatives = 1
  }

  isSupported(): boolean {
    return this.recognition !== null
  }

  async startListening(
    onTranscript: TranscriptCallback,
    onError: ErrorCallback,
    options: RecognitionOptions = {},
  ): Promise<void> {
    if (!this.recognition) {
      throw new Error("Speech recognition not supported")
    }

    if (this.isListening) {
      this.stopListening()
    }

    // Apply options
    if (options.continuous !== undefined) {
      this.recognition.continuous = options.continuous
    }
    if (options.interimResults !== undefined) {
      this.recognition.interimResults = options.interimResults
    }
    if (options.language) {
      this.recognition.lang = options.language
    }
    if (options.maxAlternatives) {
      this.recognition.maxAlternatives = options.maxAlternatives
    }

    return new Promise((resolve, reject) => {
      this.recognition.onstart = () => {
        this.isListening = true
        resolve()
      }

      this.recognition.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript, true)
        } else if (interimTranscript) {
          onTranscript(interimTranscript, false)
        }
      }

      this.recognition.onerror = (event: any) => {
        this.isListening = false
        const errorMessage = this.getErrorMessage(event.error)
        onError(errorMessage)
        reject(new Error(errorMessage))
      }

      this.recognition.onend = () => {
        this.isListening = false
      }

      try {
        this.recognition.start()
      } catch (error) {
        this.isListening = false
        const errorMessage = error instanceof Error ? error.message : "Failed to start recognition"
        onError(errorMessage)
        reject(error)
      }
    })
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening
  }

  private getErrorMessage(error: string): string {
    switch (error) {
      case "no-speech":
        return "No speech was detected. Please try again."
      case "audio-capture":
        return "Audio capture failed. Please check your microphone."
      case "not-allowed":
        return "Microphone access was denied. Please allow microphone access."
      case "network":
        return "Network error occurred during recognition."
      case "service-not-allowed":
        return "Speech recognition service is not allowed."
      case "bad-grammar":
        return "Grammar error in recognition."
      case "language-not-supported":
        return "Language is not supported for recognition."
      default:
        return `Speech recognition error: ${error}`
    }
  }

  // Get supported languages (this is a basic list, actual support varies by browser)
  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: "en-US", name: "English (US)" },
      { code: "en-GB", name: "English (UK)" },
      { code: "es-ES", name: "Spanish (Spain)" },
      { code: "es-MX", name: "Spanish (Mexico)" },
      { code: "fr-FR", name: "French (France)" },
      { code: "de-DE", name: "German (Germany)" },
      { code: "it-IT", name: "Italian (Italy)" },
      { code: "pt-BR", name: "Portuguese (Brazil)" },
      { code: "ru-RU", name: "Russian (Russia)" },
      { code: "ja-JP", name: "Japanese (Japan)" },
      { code: "ko-KR", name: "Korean (South Korea)" },
      { code: "zh-CN", name: "Chinese (Mandarin)" },
      { code: "ar-SA", name: "Arabic (Saudi Arabia)" },
      { code: "hi-IN", name: "Hindi (India)" },
    ]
  }
}

export const speechRecognition = new SpeechRecognitionService()
