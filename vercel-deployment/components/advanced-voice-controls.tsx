"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, Square, Play, Pause, Upload, Volume2, Languages, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { advancedSpeech } from "@/lib/advanced-speech"
import { groqAudio } from "@/lib/groq-audio"

interface AdvancedVoiceControlsProps {
  onTranscription: (text: string) => void
  onError: (error: string) => void
  groqApiKey?: string
}

export function AdvancedVoiceControls({ onTranscription, onError, groqApiKey }: AdvancedVoiceControlsProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [selectedModel, setSelectedModel] = useState("whisper-large-v3")
  const [selectedLanguage, setSelectedLanguage] = useState("auto")
  const [isTranslateMode, setIsTranslateMode] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [transcriptionResult, setTranscriptionResult] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Groq audio service
  useEffect(() => {
    if (groqApiKey) {
      groqAudio.setApiKey(groqApiKey)
    }
  }, [groqApiKey])

  // Update recording state
  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingIntervalRef.current = setInterval(() => {
        const state = advancedSpeech.getRecordingState()
        setRecordingDuration(state.duration)
        setAudioLevel(state.audioLevel * 100)
      }, 100)
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording, isPaused])

  const startRecording = async () => {
    try {
      await advancedSpeech.startRecording({
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      })
      setIsRecording(true)
      setRecordedAudio(null)
      setTranscriptionResult("")
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to start recording")
    }
  }

  const stopRecording = async () => {
    try {
      const audioBlob = await advancedSpeech.stopRecording()
      setIsRecording(false)
      setIsPaused(false)
      setRecordedAudio(audioBlob)
      setRecordingDuration(0)
      setAudioLevel(0)

      // Auto-process the recording
      await processAudio(audioBlob)
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to stop recording")
    }
  }

  const pauseRecording = () => {
    advancedSpeech.pauseRecording()
    setIsPaused(true)
  }

  const resumeRecording = () => {
    advancedSpeech.resumeRecording()
    setIsPaused(false)
  }

  const processAudio = async (audioBlob: Blob) => {
    if (!groqApiKey) {
      onError("Groq API key not provided")
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("file", audioBlob, "recording.webm")
      formData.append("action", isTranslateMode ? "translate" : "transcribe")
      formData.append("model", selectedModel)

      if (!isTranslateMode && selectedLanguage !== "auto") {
        formData.append("language", selectedLanguage)
      }

      const response = await fetch("/api/groq-audio", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Transcription failed")
      }

      const result = await response.json()
      setTranscriptionResult(result.text)
      onTranscription(result.text)
    } catch (error) {
      onError(error instanceof Error ? error.message : "Audio processing failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("audio/")) {
      onError("Please select an audio file")
      return
    }

    // Check file size (max 25MB for Groq)
    if (file.size > 25 * 1024 * 1024) {
      onError("File size must be less than 25MB")
      return
    }

    setRecordedAudio(file)
    await processAudio(file)
  }

  const availableModels = groqAudio.getAvailableModels()
  const supportedLanguages = groqAudio.getSupportedLanguages()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Advanced Voice Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model and Language Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-muted-foreground">{model.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Language</label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isTranslateMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Mode</label>
            <div className="flex gap-2">
              <Button
                variant={!isTranslateMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsTranslateMode(false)}
                className="flex-1"
              >
                Transcribe
              </Button>
              <Button
                variant={isTranslateMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsTranslateMode(true)}
                className="flex-1"
              >
                <Languages className="h-4 w-4 mr-1" />
                Translate
              </Button>
            </div>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="space-y-4">
          {/* Recording Status */}
          {isRecording && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">
                    {isPaused ? "Paused" : "Recording"} - {advancedSpeech.formatDuration(recordingDuration)}
                  </span>
                </div>
                <Badge variant="secondary">Level: {Math.round(audioLevel)}%</Badge>
              </div>
              <Progress value={audioLevel} className="h-2" />
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2 justify-center">
            {!isRecording ? (
              <>
                <Button onClick={startRecording} disabled={isProcessing} className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Start Recording
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
              </>
            ) : (
              <>
                {!isPaused ? (
                  <Button variant="outline" onClick={pauseRecording} className="flex items-center gap-2 bg-transparent">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={resumeRecording}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                )}
                <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Processing audio with {selectedModel}...</AlertDescription>
          </Alert>
        )}

        {/* Transcription Result */}
        {transcriptionResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">Transcription Result:</div>
              <div className="text-sm bg-muted p-2 rounded">{transcriptionResult}</div>
            </AlertDescription>
          </Alert>
        )}

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />

        {/* Info */}
        {!groqApiKey && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Groq API key not configured. Advanced voice features are disabled.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
