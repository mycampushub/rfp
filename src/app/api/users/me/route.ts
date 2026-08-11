import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"
import bcrypt from "bcryptjs"

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  mfaEnabled: z.boolean().optional(),
  currentPassword: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        name: true,
        email: true,
        roleIds: true,
        mfaEnabled: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: { id: true, name: true },
        },
      },
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // M8: If disabling MFA, require password re-confirmation
    if (data.mfaEnabled === false) {
      if (!data.currentPassword) {
        return NextResponse.json(
          { error: "Password re-confirmation is required to disable MFA" },
          { status: 400 },
        )
      }
      const currentUser = await db.user.findUnique({ where: { id: ctx.userId }, select: { password: true } })
      if (!currentUser?.password) {
        return NextResponse.json({ error: "Unable to verify password" }, { status: 500 })
      }
      const valid = await bcrypt.compare(data.currentPassword, currentUser.password)
      if (!valid) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 })
      }
    }

    // M7: If email is being changed, require re-verification
    const updateData: Record<string, unknown> = {}
    let emailChanged = false

    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) {
      const currentUser = await db.user.findUnique({ where: { id: ctx.userId }, select: { email: true } })
      if (currentUser && currentUser.email !== data.email) {
        emailChanged = true
        updateData.email = data.email
        updateData.emailVerified = null
      }
    }
    if (data.mfaEnabled !== undefined) updateData.mfaEnabled = data.mfaEnabled

    const user = await db.user.update({
      where: { id: ctx.userId },
      data: updateData,
      select: {
        id: true, name: true, email: true, roleIds: true, mfaEnabled: true, isActive: true,
      },
    })

    const response: Record<string, unknown> = { ...user }
    if (emailChanged) {
      response.message = "Email updated. Please verify your new email address."
      response.emailVerificationRequired = true
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
