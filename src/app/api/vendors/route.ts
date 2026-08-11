import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"

export const dynamic = "force-dynamic"

const createVendorSchema = z.object({
  name: z.string().min(1),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  categories: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  diversityAttrs: z.object({
    isMinorityOwned: z.boolean().optional(),
    isWomenOwned: z.boolean().optional(),
    isVeteranOwned: z.boolean().optional(),
    isDisabilityOwned: z.boolean().optional(),
  }).optional(),
})

// GET /api/vendors - List vendors
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const offset = Number(searchParams.get('offset')) || 0
    const category = searchParams.get("category")
    const certification = searchParams.get("certification")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = { tenantId: ctx.tenantId }

    if (category) {
      (where as Record<string, unknown>).categories = { contains: category }
    }
    if (certification) {
      (where as Record<string, unknown>).certifications = { contains: certification }
    }
    if (search) {
      (where as Record<string, unknown>).OR = [
        { name: { contains: search } },
        { contactInfo: { path: "$.email", string_contains: search } },
      ]
    }

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        include: {
          _count: {
            select: { invitations: true, submissions: true },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      }),
      db.vendor.count({ where }),
    ])

    return NextResponse.json({
      data: vendors,
      pagination: { limit, offset, total },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error fetching vendors:", error)
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 })
  }
}

// POST /api/vendors - Create vendor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)
    await requirePermission("vendor:create")

    const body = await request.json()
    const validatedData = createVendorSchema.parse(body)

    const vendor = await db.vendor.create({
      data: {
        tenantId: ctx.tenantId,
        name: validatedData.name,
        contactInfo: validatedData.contactInfo,
        categories: validatedData.categories,
        certifications: validatedData.certifications,
        diversityAttrs: validatedData.diversityAttrs,
      },
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error creating vendor:", error)
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 })
  }
}
