import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AuthError, PermissionError } from "@/lib/tenant-context"
import { requireSystemAdmin } from "@/lib/auth-utils"
import { z } from "zod"
import bcrypt from "bcryptjs"
import type { TransactionClient } from "@/lib/consensus-calculator"

const createUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
  tenantId: z.string().min(1),
  roleIds: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await requireSystemAdmin()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      db.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          roleIds: true,
          mfaEnabled: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          tenant: { select: { id: true, name: true } },
        },
      }),
      db.user.count(),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching admin users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await requireSystemAdmin()

    const body = await request.json()
    const data = createUserSchema.parse(body)

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await db.$transaction(async (tx: TransactionClient) => {
      // Verify tenant exists
      const tenant = await tx.tenant.findUnique({ where: { id: data.tenantId } })
      if (!tenant) {
        throw new Error('TENANT_NOT_FOUND')
      }

      // Check for duplicate email within tenant
      const existing = await tx.user.findFirst({
        where: { tenantId: data.tenantId, email: data.email },
      })
      if (existing) {
        throw new Error('USER_EXISTS')
      }

      return tx.user.create({
        data: {
          tenantId: data.tenantId,
          email: data.email,
          name: data.name,
          password: hashedPassword,
          roleIds: data.roleIds || [],
        },
        select: {
          id: true,
          email: true,
          name: true,
          roleIds: true,
          mfaEnabled: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'TENANT_NOT_FOUND':
          return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
        case 'USER_EXISTS':
          return NextResponse.json({ error: "User with this email already exists in the tenant" }, { status: 409 })
      }
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
