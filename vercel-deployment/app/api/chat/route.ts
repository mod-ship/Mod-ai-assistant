import { type NextRequest, NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

const GROQ_API_KEY = process.env.GROQ_API_KEY
const OPENROUTER_API_KEYS = [
  process.env.OPENROUTER_API_KEY_1,
  process.env.OPENROUTER_API_KEY_2,
  process.env.OPENROUTER_API_KEY_3,
  process.env.OPENROUTER_API_KEY_4,
  process.env.OPENROUTER_API_KEY_5,
].filter(Boolean)

function getRandomApiKey(): string {
  if (OPENROUTER_API_KEYS.length === 0) {
    throw new Error("No OpenRouter API keys configured")
  }
  return OPENROUTER_API_KEYS[Math.floor(Math.random() * OPENROUTER_API_KEYS.length)] as string
}

function isGroqModel(modelId: string): boolean {
  const groqModels = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "gemma2-9b-it",
  ]
  return groqModels.includes(modelId)
}

export async function POST(request: NextRequest) {
  try {
    const { message, messages = [], model = "deepseek/deepseek-r1-0528:free", options = {} } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Prepare messages for the API
    const apiMessages = [
      {
        role: "system" as const,
        content:
          "You are MOD AI Assistant, a helpful and knowledgeable AI assistant. Provide accurate, helpful, and engaging responses to user queries.",
      },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ]

    let result
    let provider = "OpenRouter"

    if (isGroqModel(model)) {
      // Use Groq for Groq models
      if (!GROQ_API_KEY) {
        throw new Error("Groq API key not configured")
      }

      provider = "Groq"
      result = await generateText({
        model: groq(model),
        messages: apiMessages,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2000,
      })
    } else {
      // Use OpenRouter for other models
      const apiKey = getRandomApiKey()

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "MOD AI Assistant",
        },
        body: JSON.stringify({
          model: model,
          messages: apiMessages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("OpenRouter API error:", errorData)
        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from API")
      }

      result = {
        text: data.choices[0].message.content,
        usage: data.usage,
        finishReason: data.choices[0].finish_reason,
      }
    }

    // Calculate estimated cost (rough approximation)
    const estimatedCost = result.usage
      ? (result.usage.prompt_tokens * 0.001 + result.usage.completion_tokens * 0.002) / 1000
      : 0

    return NextResponse.json({
      message: result.text,
      model: model,
      provider: provider,
      metadata: {
        tokens: result.usage?.total_tokens || 0,
        promptTokens: result.usage?.prompt_tokens || 0,
        completionTokens: result.usage?.completion_tokens || 0,
        cost: estimatedCost,
        finishReason: result.finishReason || "stop",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
