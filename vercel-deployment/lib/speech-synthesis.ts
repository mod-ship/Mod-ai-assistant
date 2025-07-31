interface SpeechOptions {
  rate?: number
  pitch?: number
  volume?: number
  voice?: string
}

class SpeechSynthesisService {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  private currentUtterance: SpeechSynthesisUtterance | null = null

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis
      this.loadVoices()

      // Load voices when they become available
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices()
      }
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices()
    }
  }

  isSupported(): boolean {
    return this.synth !== null
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  async speak(text: string, options: SpeechOptions = {}): Promise<void> {
    if (!this.synth) {
      throw new Error("Speech synthesis not supported")
    }

    // Stop any current speech
    this.stop()

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)

      // Set options
      utterance.rate = options.rate ?? 1
      utterance.pitch = options.pitch ?? 1
      utterance.volume = options.volume ?? 1

      // Set voice if specified
      if (options.voice) {
        const voice = this.voices.find((v) => v.name === options.voice || v.lang === options.voice)
        if (voice) {
          utterance.voice = voice
        }
      }

      // Event handlers
      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        this.currentUtterance = null
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }

      this.currentUtterance = utterance
      this.synth.speak(utterance)
    })
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel()
      this.currentUtterance = null
    }
  }

  pause(): void {
    if (this.synth) {
      this.synth.pause()
    }
  }

  resume(): void {
    if (this.synth) {
      this.synth.resume()
    }
  }

  isSpeaking(): boolean {
    return this.synth?.speaking ?? false
  }

  isPaused(): boolean {
    return this.synth?.paused ?? false
  }

  // Get recommended voices for different languages
  getRecommendedVoices(): { [key: string]: SpeechSynthesisVoice[] } {
    const recommended: { [key: string]: SpeechSynthesisVoice[] } = {}

    this.voices.forEach((voice) => {
      const lang = voice.lang.split("-")[0]
      if (!recommended[lang]) {
        recommended[lang] = []
      }
      recommended[lang].push(voice)
    })

    return recommended
  }

  // Get the best voice for a given language
  getBestVoice(language = "en"): SpeechSynthesisVoice | null {
    const langVoices = this.voices.filter((voice) => voice.lang.startsWith(language))

    if (langVoices.length === 0) {
      return this.voices[0] || null
    }

    // Prefer local voices over remote ones
    const localVoices = langVoices.filter((voice) => voice.localService)
    if (localVoices.length > 0) {
      return localVoices[0]
    }

    return langVoices[0]
  }
}

export const speechSynthesis = new SpeechSynthesisService()
