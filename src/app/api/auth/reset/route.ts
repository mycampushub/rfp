import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { randomUUID } from "crypto"
import { sendEmail } from "@/lib/email-service"

// In-memory token store — in production, use a DB table with expiry
const resetTokens = new Map<string, { email: string; expiresAt: number; tenantId?: string }>()

const TOKEN_TTL_MS = 15 * 60 * 1000 // 15 minutes

// POST /api/auth/reset — request a password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await db.user.findFirst({ where: { email: String(email) } })
    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({ message: "If the email exists, a reset link has been sent" })
    }

    const token = randomUUID()
    resetTokens.set(token, {
      email: user.email,
      expiresAt: Date.now() + TOKEN_TTL_MS,
      tenantId: user.tenantId || undefined,
    })

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset?token=${token}`
    await sendEmail({
      to: user.email,
      subject: "Password Reset — RFP Platform",
      html: `<p>You requested a password reset. Click the link below to set a new password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link expires in 15 minutes.</p>`,
      text: `Reset your password at: ${resetUrl} (expires in 15 minutes)`,
    })

    return NextResponse.json({ message: "If the email exists, a reset link has been sent" })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ error: "Failed to process reset request" }, { status: 500 })
  }
}

// PUT /api/auth/reset — reset the password using a token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const record = resetTokens.get(token)
    if (!record) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    if (Date.now() > record.expiresAt) {
      resetTokens.delete(token)
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    const hashedPassword = await hash(newPassword, 12)
    await db.user.updateMany({
      where: { email: record.email },
      data: { password: hashedPassword },
    })

    resetTokens.delete(token)

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
