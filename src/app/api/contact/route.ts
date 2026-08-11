import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
})

// In-memory store for contact submissions (persists for the lifetime of the server process)
const contactSubmissions: Array<{
  id: string
  name: string
  email: string
  subject: string
  message: string
  createdAt: string
}> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = contactSchema.parse(body)

    const submission = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      createdAt: new Date().toISOString(),
    }

    contactSubmissions.push(submission)

    return NextResponse.json({ success: true, message: "Message received successfully" }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("Error processing contact form:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}
