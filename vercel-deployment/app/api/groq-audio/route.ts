import { type NextRequest, NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const audioFile = formData.get("file") as File
    const action = formData.get("action") as string
    const model = (formData.get("model") as string) || "whisper-large-v3"
    const language = formData.get("language") as string
    const temperature = formData.get("temperature") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Prepare form data for Groq API
    const groqFormData = new FormData()
    groqFormData.append("file", audioFile)
    groqFormData.append("model", model)

    if (language && language !== "auto") {
      groqFormData.append("language", language)
    }

    if (temperature) {
      groqFormData.append("temperature", temperature)
    }

    // Determine endpoint based on action
    const endpoint =
      action === "translate"
        ? "https://api.groq.com/openai/v1/audio/translations"
        : "https://api.groq.com/openai/v1/audio/transcriptions"

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: groqFormData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("Groq API error:", errorData)
      return NextResponse.json(
        {
          error: errorData.error?.message || `Groq API error: ${response.status}`,
          details: errorData,
        },
        { status: response.status },
      )
    }

    const result = await response.json()

    return NextResponse.json({
      text: result.text,
      language: result.language,
      duration: result.duration,
      model: model,
      action: action,
    })
  } catch (error) {
    console.error("Groq audio API error:", error)
    return NextResponse.json(
      {
        error: "Audio processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
