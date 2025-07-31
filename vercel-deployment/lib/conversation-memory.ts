export interface ConversationMessage {
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

export interface Conversation {
  id: string
  title: string
  messages: ConversationMessage[]
  model: string
  createdAt: Date
  updatedAt: Date
}

class ConversationMemory {
  private conversations: Map<string, Conversation> = new Map()
  private currentConversationId: string | null = null
  private readonly STORAGE_KEY = "mod_ai_conversations"
  private readonly MAX_CONVERSATIONS = 50
  private readonly MAX_MESSAGES_PER_CONVERSATION = 100

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        data.forEach((conv: any) => {
          this.conversations.set(conv.id, {
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          })
        })
      }
    } catch (error) {
      console.error("Failed to load conversations from storage:", error)
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return

    try {
      const data = Array.from(this.conversations.values())
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error("Failed to save conversations to storage:", error)
    }
  }

  createConversation(model: string): string {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const conversation: Conversation = {
      id,
      title: "New Conversation",
      messages: [],
      model,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.conversations.set(id, conversation)
    this.currentConversationId = id

    // Limit number of conversations
    if (this.conversations.size > this.MAX_CONVERSATIONS) {
      const oldest = Array.from(this.conversations.values()).sort(
        (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
      )[0]
      this.conversations.delete(oldest.id)
    }

    this.saveToStorage()
    return id
  }

  addMessage(conversationId: string, message: Omit<ConversationMessage, "id" | "timestamp">): void {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return

    const newMessage: ConversationMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }

    conversation.messages.push(newMessage)
    conversation.updatedAt = new Date()

    // Update title based on first user message
    if (conversation.messages.length === 1 && message.role === "user") {
      conversation.title = message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
    }

    // Limit messages per conversation
    if (conversation.messages.length > this.MAX_MESSAGES_PER_CONVERSATION) {
      conversation.messages = conversation.messages.slice(-this.MAX_MESSAGES_PER_CONVERSATION)
    }

    this.saveToStorage()
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id)
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  deleteConversation(id: string): void {
    this.conversations.delete(id)
    if (this.currentConversationId === id) {
      this.currentConversationId = null
    }
    this.saveToStorage()
  }

  setCurrentConversation(id: string): void {
    this.currentConversationId = id
  }

  getCurrentConversationId(): string | null {
    return this.currentConversationId
  }

  getContextMessages(conversationId: string, maxTokens = 4000): ConversationMessage[] {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return []

    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    let totalTokens = 0
    const contextMessages: ConversationMessage[] = []

    // Start from the most recent messages
    for (let i = conversation.messages.length - 1; i >= 0; i--) {
      const message = conversation.messages[i]
      const estimatedTokens = Math.ceil(message.content.length / 4)

      if (totalTokens + estimatedTokens > maxTokens && contextMessages.length > 0) {
        break
      }

      contextMessages.unshift(message)
      totalTokens += estimatedTokens
    }

    return contextMessages
  }

  clearAllConversations(): void {
    this.conversations.clear()
    this.currentConversationId = null
    this.saveToStorage()
  }

  exportConversations(): string {
    const data = Array.from(this.conversations.values())
    return JSON.stringify(data, null, 2)
  }

  importConversations(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      if (Array.isArray(data)) {
        this.conversations.clear()
        data.forEach((conv: any) => {
          this.conversations.set(conv.id, {
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          })
        })
        this.saveToStorage()
        return true
      }
    } catch (error) {
      console.error("Failed to import conversations:", error)
    }
    return false
  }
}

export const conversationMemory = new ConversationMemory()
