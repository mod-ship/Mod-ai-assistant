"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { MessageSquare, Plus, Trash2, Clock, Bot, X } from "lucide-react"
import { conversationMemory, type Conversation } from "@/lib/conversation-memory"
import { getModelById } from "@/lib/ai-models"

interface ConversationSidebarProps {
  currentConversationId: string | null
  onConversationSelect: (id: string) => void
  onNewConversation: () => void
  isOpen: boolean
  onClose: () => void
}

export function ConversationSidebar({
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  isOpen,
  onClose,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = React.useState<Conversation[]>([])

  React.useEffect(() => {
    const loadConversations = () => {
      const allConversations = conversationMemory.getAllConversations()
      setConversations(allConversations)
    }

    loadConversations()

    // Refresh conversations periodically
    const interval = setInterval(loadConversations, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleDeleteConversation = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    conversationMemory.deleteConversation(id)
    setConversations(conversationMemory.getAllConversations())

    if (currentConversationId === id) {
      onNewConversation()
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getMessageCount = (conversation: Conversation) => {
    return conversation.messages.length
  }

  const getLastMessage = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (!lastMessage) return "No messages"

    const content = lastMessage.content.length > 50 ? lastMessage.content.slice(0, 50) + "..." : lastMessage.content

    return `${lastMessage.role === "user" ? "You" : "AI"}: ${content}`
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="font-semibold">Conversations</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <Button
          onClick={() => {
            onNewConversation()
            onClose()
          }}
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const modelInfo = getModelById(conversation.model)
              const isActive = conversation.id === currentConversationId

              return (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent ${
                    isActive ? "bg-accent border-primary" : "border-border"
                  }`}
                  onClick={() => {
                    onConversationSelect(conversation.id)
                    onClose()
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
                        {isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{getLastMessage(conversation)}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {modelInfo?.provider || "Unknown"}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {getMessageCount(conversation)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(conversation.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bot className="h-4 w-4" />
          <span>MOD AI Assistant</span>
          <Badge variant="secondary" className="text-xs">
            {conversations.length} chats
          </Badge>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-80 border-r bg-background">
        <SidebarContent />
      </div>

      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-80 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
