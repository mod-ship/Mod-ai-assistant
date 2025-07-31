interface AudioRecorderOptions {
  mimeType?: string
  audioBitsPerSecond?: number
  sampleRate?: number
}

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioLevel: number
}

class AdvancedSpeechService {
  private mediaRecorder: MediaRecorder | null = null
  private audioStream: MediaStream | null = null
  private audioChunks: Blob[] = []
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private microphone: MediaStreamAudioSourceNode | null = null
  private recordingState: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
  }
  private recordingTimer: NodeJS.Timeout | null = null
  private levelUpdateTimer: NodeJS.Timeout | null = null

  async startRecording(options: AudioRecorderOptions = {}): Promise<void> {
    try {
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: options.sampleRate || 44100,
        },
      })

      // Set up audio analysis
      this.setupAudioAnalysis()

      // Configure MediaRecorder
      const mimeType = this.getSupportedMimeType(options.mimeType)
      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType,
      }

      if (options.audioBitsPerSecond) {
        mediaRecorderOptions.audioBitsPerSecond = options.audioBitsPerSecond
      }

      this.mediaRecorder = new MediaRecorder(this.audioStream, mediaRecorderOptions)

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstart = () => {
        this.recordingState.isRecording = true
        this.recordingState.duration = 0
        this.startTimers()
      }

      this.mediaRecorder.onstop = () => {
        this.recordingState.isRecording = false
        this.recordingState.isPaused = false
        this.stopTimers()
        this.cleanup()
      }

      this.mediaRecorder.onpause = () => {
        this.recordingState.isPaused = true
      }

      this.mediaRecorder.onresume = () => {
        this.recordingState.isPaused = false
      }

      // Start recording
      this.audioChunks = []
      this.mediaRecorder.start(100) // Collect data every 100ms
    } catch (error) {
      this.cleanup()
      throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        reject(new Error("No active recording to stop"))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || "audio/webm",
        })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause()
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume()
    }
  }

  getRecordingState(): RecordingState {
    return { ...this.recordingState }
  }

  private setupAudioAnalysis(): void {
    if (!this.audioStream) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.microphone = this.audioContext.createMediaStreamSource(this.audioStream)

      this.analyser.fftSize = 256
      this.microphone.connect(this.analyser)
    } catch (error) {
      console.warn("Audio analysis setup failed:", error)
    }
  }

  private startTimers(): void {
    // Duration timer
    this.recordingTimer = setInterval(() => {
      if (this.recordingState.isRecording && !this.recordingState.isPaused) {
        this.recordingState.duration += 0.1
      }
    }, 100)

    // Audio level timer
    this.levelUpdateTimer = setInterval(() => {
      this.updateAudioLevel()
    }, 50)
  }

  private stopTimers(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer)
      this.recordingTimer = null
    }
    if (this.levelUpdateTimer) {
      clearInterval(this.levelUpdateTimer)
      this.levelUpdateTimer = null
    }
  }

  private updateAudioLevel(): void {
    if (!this.analyser) return

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(dataArray)

    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i]
    }

    this.recordingState.audioLevel = sum / bufferLength / 255
  }

  private cleanup(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop())
      this.audioStream = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.analyser = null
    this.microphone = null
    this.stopTimers()
  }

  private getSupportedMimeType(preferredType?: string): string {
    const types = [
      preferredType,
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/wav",
    ].filter(Boolean) as string[]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return "audio/webm" // Fallback
  }

  // Utility methods
  isRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
  }

  getSupportedMimeTypes(): string[] {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/wav"]

    return types.filter((type) => MediaRecorder.isTypeSupported(type))
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
}

export const advancedSpeech = new AdvancedSpeechService()
