import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requireTenantAdmin } from "@/lib/auth-utils"
import { z } from "zod"
import bcrypt from "bcryptjs"

const createTenantUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string().optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const where = { tenantId: ctx.tenantId, isActive: true }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          roleIds: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching tenant users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const ctx = getTenantContext(session)

    // Require tenant admin to create users within the tenant
    await requireTenantAdmin()

    const body = await request.json()
    const data = createTenantUserSchema.parse(body)

    // Check for duplicate email within the same tenant
    const existing = await db.user.findFirst({
      where: { tenantId: ctx.tenantId, email: data.email },
    })
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists in your organization" }, { status: 409 })
    }

    // Find or create a 'Member' role within the tenant for the new user
    let userRole = await db.role.findFirst({
      where: { tenantId: ctx.tenantId, name: data.role || "Member" },
    })

    if (!userRole) {
      userRole = await db.role.create({
        data: {
          tenantId: ctx.tenantId,
          name: data.role || "Member",
          permissions: ["rfp:view", "submission:view", "approval:view"],
        },
      })
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await db.user.create({
      data: {
        tenantId: ctx.tenantId,
        email: data.email,
        name: data.name,
        password: hashedPassword,
        roleIds: [userRole.id],
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        roleIds: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error creating tenant user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
