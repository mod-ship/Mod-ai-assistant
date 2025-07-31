interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

class AuthService {
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
  }
  private readonly STORAGE_KEY = "mod_ai_auth"
  private readonly DEMO_USER: User = {
    id: "demo_user",
    email: "demo@modai.com",
    name: "Demo User",
    createdAt: new Date(),
  }

  constructor() {
    this.loadAuthState()
  }

  private loadAuthState() {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.authState = {
          user: {
            ...data.user,
            createdAt: new Date(data.user.createdAt),
          },
          isAuthenticated: data.isAuthenticated,
        }
      }
    } catch (error) {
      console.error("Failed to load auth state:", error)
      this.clearAuthState()
    }
  }

  private saveAuthState() {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.authState))
    } catch (error) {
      console.error("Failed to save auth state:", error)
    }
  }

  private clearAuthState() {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.STORAGE_KEY)
    this.authState = { user: null, isAuthenticated: false }
  }

  async signUp(email: string, password: string, name: string): Promise<User> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Basic validation
    if (!email || !password || !name) {
      throw new Error("All fields are required")
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters")
    }

    if (!email.includes("@")) {
      throw new Error("Please enter a valid email address")
    }

    // Check if user already exists (simulate)
    const existingUsers = this.getStoredUsers()
    if (existingUsers.some((user) => user.email === email)) {
      throw new Error("An account with this email already exists")
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      createdAt: new Date(),
    }

    // Store user (in real app, this would be sent to backend)
    this.storeUser(newUser, password)

    // Set auth state
    this.authState = {
      user: newUser,
      isAuthenticated: true,
    }
    this.saveAuthState()

    return newUser
  }

  async signIn(email: string, password: string): Promise<User> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check for demo account
    if (email === "demo@modai.com" && password === "demo123") {
      this.authState = {
        user: this.DEMO_USER,
        isAuthenticated: true,
      }
      this.saveAuthState()
      return this.DEMO_USER
    }

    // Basic validation
    if (!email || !password) {
      throw new Error("Email and password are required")
    }

    // Check stored users
    const storedUsers = this.getStoredUsers()
    const userRecord = storedUsers.find((record) => record.user.email === email)

    if (!userRecord) {
      throw new Error("No account found with this email address")
    }

    if (userRecord.password !== password) {
      throw new Error("Incorrect password")
    }

    // Set auth state
    this.authState = {
      user: userRecord.user,
      isAuthenticated: true,
    }
    this.saveAuthState()

    return userRecord.user
  }

  async signOut(): Promise<void> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    this.clearAuthState()
  }

  getCurrentUser(): User | null {
    return this.authState.user
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated
  }

  private getStoredUsers(): Array<{ user: User; password: string }> {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem("mod_ai_users")
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to load stored users:", error)
      return []
    }
  }

  private storeUser(user: User, password: string) {
    if (typeof window === "undefined") return

    try {
      const existingUsers = this.getStoredUsers()
      const updatedUsers = [...existingUsers, { user, password }]
      localStorage.setItem("mod_ai_users", JSON.stringify(updatedUsers))
    } catch (error) {
      console.error("Failed to store user:", error)
    }
  }

  // Utility methods
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 6) {
      errors.push("Password must be at least 6 characters long")
    }

    if (!/[A-Za-z]/.test(password)) {
      errors.push("Password must contain at least one letter")
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  getPasswordStrength(password: string): "weak" | "medium" | "strong" {
    let score = 0

    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score < 3) return "weak"
    if (score < 5) return "medium"
    return "strong"
  }
}

export const authService = new AuthService()
