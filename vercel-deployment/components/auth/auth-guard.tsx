"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { SignInForm } from "./sign-in-form"
import { SignUpForm } from "./sign-up-form"
import { authService } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Bot } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showSignUp, setShowSignUp] = useState(false)

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)
    }

    checkAuth()
  }, [])

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Bot className="h-12 w-12 text-purple-600 mb-4" />
            <Loader2 className="h-6 w-6 animate-spin text-purple-600 mb-4" />
            <p className="text-sm text-muted-foreground">Loading MOD AI Assistant...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show auth forms if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Bot className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              MOD AI Assistant
            </h1>
            <p className="text-muted-foreground mt-2">Your advanced AI companion with 15+ models</p>
          </div>

          {/* Auth Forms */}
          {showSignUp ? (
            <SignUpForm onSuccess={handleAuthSuccess} onSwitchToSignIn={() => setShowSignUp(false)} />
          ) : (
            <SignInForm onSuccess={handleAuthSuccess} onSwitchToSignUp={() => setShowSignUp(true)} />
          )}

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">
              Powered by advanced AI models from OpenAI, Anthropic, Google, and more
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Render protected content
  return <>{children}</>
}
