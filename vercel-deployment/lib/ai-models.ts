export interface AIModel {
  id: string
  name: string
  provider: string
  description: string
  contextWindow: number
  pricing: {
    input: number
    output: number
  }
  capabilities: string[]
  category: "chat" | "vision" | "code" | "reasoning"
}

export const AI_MODELS: AIModel[] = [
  // OpenRouter Models
  {
    id: "deepseek/deepseek-r1-0528:free",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    description: "Advanced reasoning model with strong analytical capabilities",
    contextWindow: 32768,
    pricing: { input: 0, output: 0 },
    capabilities: ["reasoning", "analysis", "math", "coding"],
    category: "reasoning",
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    description: "Latest Claude model with enhanced reasoning and vision",
    contextWindow: 200000,
    pricing: { input: 0.003, output: 0.015 },
    capabilities: ["reasoning", "vision", "coding", "analysis"],
    category: "vision",
  },
  {
    id: "moonshotai/kimi-vl-a3b-thinking",
    name: "Kimi VL A3B Thinking",
    provider: "Moonshot AI",
    description: "Vision-language model with thinking capabilities",
    contextWindow: 128000,
    pricing: { input: 0.002, output: 0.008 },
    capabilities: ["vision", "reasoning", "multimodal"],
    category: "vision",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Multimodal flagship model with vision and reasoning",
    contextWindow: 128000,
    pricing: { input: 0.005, output: 0.015 },
    capabilities: ["reasoning", "vision", "coding", "multimodal"],
    category: "vision",
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini Pro 1.5",
    provider: "Google",
    description: "Large context window model with multimodal capabilities",
    contextWindow: 1000000,
    pricing: { input: 0.001, output: 0.003 },
    capabilities: ["reasoning", "vision", "long-context"],
    category: "vision",
  },
  {
    id: "meta-llama/llama-3.2-90b-vision-instruct",
    name: "Llama 3.2 90B Vision",
    provider: "Meta",
    description: "Open-source vision model with strong performance",
    contextWindow: 128000,
    pricing: { input: 0.0009, output: 0.0009 },
    capabilities: ["vision", "reasoning", "open-source"],
    category: "vision",
  },

  // Groq Models
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    provider: "Groq",
    description: "Ultra-fast inference with Groq hardware acceleration",
    contextWindow: 32768,
    pricing: { input: 0.0005, output: 0.0008 },
    capabilities: ["fast-inference", "reasoning", "coding"],
    category: "chat",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "Groq",
    description: "Lightning-fast responses with Groq optimization",
    contextWindow: 131072,
    pricing: { input: 0.0001, output: 0.0001 },
    capabilities: ["ultra-fast", "efficient", "coding"],
    category: "chat",
  },
  {
    id: "llama3-70b-8192",
    name: "Llama 3 70B",
    provider: "Groq",
    description: "High-performance model with Groq acceleration",
    contextWindow: 8192,
    pricing: { input: 0.0005, output: 0.0008 },
    capabilities: ["fast-inference", "reasoning"],
    category: "chat",
  },
  {
    id: "llama3-8b-8192",
    name: "Llama 3 8B",
    provider: "Groq",
    description: "Efficient model optimized for speed",
    contextWindow: 8192,
    pricing: { input: 0.0001, output: 0.0001 },
    capabilities: ["ultra-fast", "efficient"],
    category: "chat",
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B IT",
    provider: "Groq",
    description: "Instruction-tuned model with fast inference",
    contextWindow: 8192,
    pricing: { input: 0.0002, output: 0.0002 },
    capabilities: ["fast-inference", "instruction-following"],
    category: "chat",
  },

  // Additional OpenRouter Models
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    description: "Fast and efficient Claude model",
    contextWindow: 200000,
    pricing: { input: 0.001, output: 0.005 },
    capabilities: ["fast", "efficient", "reasoning"],
    category: "chat",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Compact version of GPT-4o with good performance",
    contextWindow: 128000,
    pricing: { input: 0.00015, output: 0.0006 },
    capabilities: ["efficient", "reasoning", "coding"],
    category: "chat",
  },
  {
    id: "google/gemini-flash-1.5",
    name: "Gemini Flash 1.5",
    provider: "Google",
    description: "Fast Gemini model optimized for speed",
    contextWindow: 1000000,
    pricing: { input: 0.00075, output: 0.003 },
    capabilities: ["fast", "long-context", "multimodal"],
    category: "chat",
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "Mistral AI",
    description: "Large-scale model with strong performance",
    contextWindow: 128000,
    pricing: { input: 0.004, output: 0.012 },
    capabilities: ["reasoning", "multilingual", "coding"],
    category: "chat",
  },
  {
    id: "cohere/command-r-plus",
    name: "Command R+",
    provider: "Cohere",
    description: "Advanced command-following model",
    contextWindow: 128000,
    pricing: { input: 0.003, output: 0.015 },
    capabilities: ["reasoning", "tool-use", "rag"],
    category: "chat",
  },
]

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((model) => model.id === id)
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AI_MODELS.filter((model) => model.provider === provider)
}

export function getModelsByCategory(category: string): AIModel[] {
  return AI_MODELS.filter((model) => model.category === category)
}

export function getFastestModels(): AIModel[] {
  return AI_MODELS.filter(
    (model) =>
      model.capabilities.includes("fast-inference") ||
      model.capabilities.includes("ultra-fast") ||
      model.provider === "Groq",
  )
}

export function getCheapestModels(): AIModel[] {
  return AI_MODELS.filter((model) => model.pricing.input <= 0.001 && model.pricing.output <= 0.001)
}

export function getVisionModels(): AIModel[] {
  return AI_MODELS.filter((model) => model.capabilities.includes("vision") || model.capabilities.includes("multimodal"))
}
