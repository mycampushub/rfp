/**
 * Versioned Vendors API (v1)
 *
 * This is the versioned API under /api/v1/vendors.
 * The base routes at /api/vendors are considered legacy and will be deprecated in a future release.
 *
 * Key differences from the base /api/vendors routes:
 *   - GET returns paginated results (page/limit query params) wrapped in { data, pagination }
 *     instead of a flat array.
 *   - GET supports search, category filtering, and isActive query param.
 *   - POST accepts structured contactInfo, categories, certifications, and diversityAttrs.
 *   - All mutations log activity to the audit trail.
 *
 * Consumers should migrate to these v1 endpoints for new integrations.
 */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"

const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required").max(200),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().url().optional(),
  }).optional(),
  categories: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  diversityAttrs: z.object({
    isMinorityOwned: z.boolean().optional(),
    isWomenOwned: z.boolean().optional(),
    isVeteranOwned: z.boolean().optional(),
    isDisabilityOwned: z.boolean().optional(),
    certifications: z.array(z.string()).optional(),
  }).optional(),
})

// GET /api/v1/vendors - List vendors
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const isActive = searchParams.get("isActive")

    const skip = (page - 1) * limit
    const where: Record<string, unknown> = { tenantId: ctx.tenantId }

    if (category) {
      (where as Record<string, unknown>).categories = { contains: category }
    }
    if (search) {
      (where as Record<string, unknown>).OR = [
        { name: { contains: search } },
        { contactInfo: { path: "$.email", string_contains: search } },
      ]
    }
    if (isActive !== null) {
      (where as Record<string, unknown>).isActive = isActive === "true"
    }

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        include: {
          _count: { select: { invitations: true, submissions: true, qna: true } }
        },
        skip, take: limit,
        orderBy: { name: "asc" }
      }),
      db.vendor.count({ where })
    ])

    return NextResponse.json({
      data: vendors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching vendors:", error)
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 })
  }
}

// POST /api/v1/vendors - Create vendor
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requirePermission('vendor:create')

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
      include: {
        _count: { select: { invitations: true, submissions: true, qna: true } }
      }
    })

    await db.activityLog.create({
      data: {
        tenantId: ctx.tenantId,
        actor: ctx.userId,
        action: "CREATE_VENDOR",
        targetType: "Vendor",
        targetId: vendor.id,
        metadata: { vendorName: vendor.name }
      }
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error creating vendor:", error)
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 })
  }
}