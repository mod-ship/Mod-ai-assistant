"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Settings,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ImageIcon,
  MessageSquare,
  Palette,
  Menu,
  LogOut,
  UserCircle,
} from "lucide-react"
import { ModelSelector } from "@/components/model-selector"
import { ConversationSidebar } from "@/components/conversation-sidebar"
import { conversationMemory } from "@/lib/conversation-memory"
import { speechSynthesis } from "@/lib/speech-synthesis"
import { speechRecognition } from "@/lib/speech-recognition"
import { getModelById } from "@/lib/ai-models"
import { AdvancedVoiceControls } from "@/components/advanced-voice-controls"
import { AuthGuard } from "@/components/auth/auth-guard"
import { authService } from "@/lib/auth"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  model?: string
  metadata?: {
    tokens?: number
    cost?: number
    provider?: string
  }
}

function AIAssistantContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-r1-0528:free")
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isImageMode, setIsImageMode] = useState(false)
  const [imagePrompt, setImagePrompt] = useState("")
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [showAdvancedVoice, setShowAdvancedVoice] = useState(false)
  const [groqApiKey, setGroqApiKey] = useState<string | null>(null)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize conversation
  useEffect(() => {
    const initConversation = () => {
      const existingConversations = conversationMemory.getAllConversations()
      if (existingConversations.length > 0) {
        const latest = existingConversations[0]
        setCurrentConversationId(latest.id)
        setMessages(
          latest.messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            timestamp: msg.timestamp,
            model: msg.model,
            metadata: msg.metadata,
          })),
        )
        setSelectedModel(latest.model)
      } else {
        startNewConversation()
      }
    }

    initConversation()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Add this useEffect to get Groq API key
  useEffect(() => {
    // In a real app, you'd get this from environment or user settings
    setGroqApiKey(process.env.NEXT_PUBLIC_GROQ_API_KEY || null)
  }, [])

  const startNewConversation = () => {
    const conversationId = conversationMemory.createConversation(selectedModel)
    setCurrentConversationId(conversationId)

    const welcomeMessage: Message = {
      id: "welcome",
      content: `Hello! I'm MOD AI Assistant with access to 15+ advanced AI models including Claude Sonnet 4, GPT-4o, and ultra-fast Groq models. I can help with coding, writing, analysis, image generation, and much more. What would you like to explore today?`,
      role: "assistant",
      timestamp: new Date(),
      model: selectedModel,
    }

    setMessages([welcomeMessage])
    conversationMemory.addMessage(conversationId, {
      content: welcomeMessage.content,
      role: welcomeMessage.role,
      model: selectedModel,
    })
  }

  const handleConversationSelect = (conversationId: string) => {
    const conversation = conversationMemory.getConversation(conversationId)
    if (conversation) {
      setCurrentConversationId(conversationId)
      setMessages(
        conversation.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp,
          model: msg.model,
          metadata: msg.metadata,
        })),
      )
      setSelectedModel(conversation.model)
      conversationMemory.setCurrentConversation(conversationId)
    }
    setIsSidebarOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !isImageMode) || isLoading) return

    if (!currentConversationId) {
      startNewConversation()
      return
    }

    if (isImageMode) {
      await handleImageGeneration()
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    conversationMemory.addMessage(currentConversationId, {
      content: input,
      role: "user",
    })

    const currentInput = input
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const contextMessages = conversationMemory.getContextMessages(currentConversationId, 4000)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          messages: contextMessages,
          model: selectedModel,
          options: {
            temperature: 0.7,
            maxTokens: 2000,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: "assistant",
        timestamp: new Date(),
        model: data.model,
        metadata: data.metadata,
      }

      setMessages((prev) => [...prev, assistantMessage])
      conversationMemory.addMessage(currentConversationId, {
        content: data.message,
        role: "assistant",
        model: data.model,
        metadata: data.metadata,
      })
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I'm having trouble processing your request. Please try again or switch to a different model.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageGeneration = async () => {
    if (!imagePrompt.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/image-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          model: "black-forest-labs/flux-schnell",
          options: {
            size: "1024x1024",
            count: 1,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image")
      }

      if (data.images && data.images.length > 0) {
        setGeneratedImages(data.images.map((img: any) => img.url))

        const imageMessage: Message = {
          id: Date.now().toString(),
          content: `Generated image for: "${imagePrompt}"`,
          role: "assistant",
          timestamp: new Date(),
          model: "flux-schnell",
        }

        setMessages((prev) => [...prev, imageMessage])
        if (currentConversationId) {
          conversationMemory.addMessage(currentConversationId, {
            content: imageMessage.content,
            role: "assistant",
            model: "flux-schnell",
          })
        }
      }

      setImagePrompt("")
    } catch (error) {
      console.error("Image generation error:", error)
      setError(error instanceof Error ? error.message : "Failed to generate image")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceInput = async () => {
    if (!speechRecognition.isSupported()) {
      setError("Speech recognition is not supported in your browser")
      return
    }

    if (isListening) {
      speechRecognition.stopListening()
      setIsListening(false)
      return
    }

    try {
      setIsListening(true)
      await speechRecognition.startListening(
        (transcript, isFinal) => {
          if (isFinal) {
            setInput(transcript)
            setIsListening(false)
          }
        },
        (error) => {
          setError(error)
          setIsListening(false)
        },
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : "Voice input failed")
      setIsListening(false)
    }
  }

  const handleTextToSpeech = async (text: string) => {
    if (!speechSynthesis.isSupported()) {
      setError("Text-to-speech is not supported in your browser")
      return
    }

    if (isSpeaking) {
      speechSynthesis.stop()
      setIsSpeaking(false)
      return
    }

    try {
      setIsSpeaking(true)
      await speechSynthesis.speak(text, {
        rate: 1,
        pitch: 1,
        volume: 0.8,
      })
      setIsSpeaking(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Text-to-speech failed")
      setIsSpeaking(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await authService.signOut()
      window.location.reload()
    } catch (error) {
      setError("Failed to sign out")
    }
  }

  const selectedModelInfo = getModelById(selectedModel)
  const currentUser = authService.getCurrentUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={startNewConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto p-4">
        <Card className="h-[90vh] flex flex-col shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-white hover:bg-white/20 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Bot className="h-8 w-8" />
                <div>
                  <CardTitle className="text-xl">MOD AI Assistant</CardTitle>
                  <CardDescription className="text-blue-100">
                    {selectedModelInfo ? `${selectedModelInfo.name} • ${selectedModelInfo.provider}` : selectedModel}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-500 text-white">
                  Online
                </Badge>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
                    >
                      <UserCircle className="h-4 w-4 mr-1" />
                      {currentUser?.name || "User"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={isModelSelectorOpen} onOpenChange={setIsModelSelectorOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Models
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      onClose={() => setIsModelSelectorOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4 p-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-4 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div className="flex-shrink-0">
                        {message.role === "user" ? (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div
                        className={`rounded-2xl p-4 shadow-md ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            : "bg-white text-gray-900 border border-gray-200"
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                            {message.model && (
                              <Badge variant="outline" className="text-xs">
                                {message.model.split("/").pop()?.split(":")[0] || message.model}
                              </Badge>
                            )}
                            {message.metadata?.tokens && (
                              <span className="text-xs text-muted-foreground">{message.metadata.tokens} tokens</span>
                            )}
                          </div>
                          {message.role === "assistant" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTextToSpeech(message.content)}
                              className="h-6 w-6 p-0"
                            >
                              {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Generated Images Display */}
                {generatedImages.length > 0 && (
                  <div className="flex justify-start">
                    <div className="flex gap-4 max-w-[85%]">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <Palette className="h-5 w-5 text-white" />
                      </div>
                      <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
                        <div className="grid gap-2">
                          {generatedImages.map((imageUrl, index) => (
                            <img
                              key={index}
                              src={imageUrl || "/placeholder.svg"}
                              alt={`Generated image ${index + 1}`}
                              className="rounded-lg max-w-sm"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        <span className="text-sm text-gray-600">
                          {isImageMode ? "Generating image..." : "AI is thinking..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Advanced Voice Controls */}
            {showAdvancedVoice && (
              <div className="mb-4">
                <AdvancedVoiceControls
                  onTranscription={(text) => {
                    setInput(text)
                    setShowAdvancedVoice(false)
                  }}
                  onError={setError}
                  groqApiKey={groqApiKey || undefined}
                />
              </div>
            )}

            {/* Input Area */}
            <div className="space-y-3 pt-4 border-t">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={!isImageMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsImageMode(false)}
                  className="flex items-center gap-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </Button>
                <Button
                  variant={isImageMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsImageMode(true)}
                  className="flex items-center gap-1"
                >
                  <ImageIcon className="h-4 w-4" />
                  Image
                </Button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="flex gap-3">
                {isImageMode ? (
                  <Textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    disabled={isLoading}
                    className="flex-1 min-h-[60px] text-base rounded-xl border-2 focus:border-purple-500"
                  />
                ) : (
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything... I have access to 15+ advanced AI models!"
                    disabled={isLoading}
                    className="flex-1 h-12 text-base rounded-xl border-2 focus:border-purple-500"
                  />
                )}

                <div className="flex gap-2">
                  {!isImageMode && (
                    <div className="flex gap-2">
                      {speechRecognition.isSupported() && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleVoiceInput}
                          disabled={isLoading}
                          className={`h-12 w-12 rounded-xl ${isListening ? "bg-red-100 border-red-300" : ""}`}
                        >
                          {isListening ? <MicOff className="h-5 w-5 text-red-600" /> : <Mic className="h-5 w-5" />}
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowAdvancedVoice(!showAdvancedVoice)}
                        disabled={isLoading}
                        className="h-12 w-12 rounded-xl"
                        title="Advanced Voice Controls"
                      >
                        <Volume2 className="h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || (!input.trim() && !imagePrompt.trim())}
                    className="h-12 px-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl shadow-lg"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden file input for future image upload feature */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          // Future implementation for image upload
          console.log("File selected:", e.target.files?.[0])
        }}
      />
    </div>
  )
}

export default function AdvancedAIAssistant() {
  return (
    <AuthGuard>
      <AIAssistantContent />
    </AuthGuard>
  )
}
