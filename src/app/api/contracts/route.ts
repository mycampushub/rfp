import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import { dispatchWebhooks } from "@/lib/webhook-dispatcher"

const createContractSchema = z.object({
  tenantId: z.string(),
  rfpId: z.string(),
  submissionId: z.string(),
  vendorId: z.string(),
  status: z.enum(['draft', 'active', 'completed', 'terminated', 'expired']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  value: z.number().min(0).optional(),
  terms: z.string().max(10000).optional(),
  notes: z.string().max(5000).optional(),
  awardedBy: z.string(),
})

/**
 * GET /api/contracts
 * List contracts for the authenticated tenant with pagination and optional status filter.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const skip = (page - 1) * limit
    const status = searchParams.get("status")

    const whereClause: Record<string, unknown> = { tenantId: ctx.tenantId }
    if (status) {
      whereClause.status = status
    }

    const [contracts, total] = await Promise.all([
      db.contract.findMany({
        where: whereClause,
        include: {
          rfp: { select: { id: true, title: true, status: true } },
          vendor: { select: { id: true, name: true } },
          awardedByUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.contract.count({ where: whereClause }),
    ])

    return NextResponse.json({
      data: contracts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching contracts:", error)
    return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 })
  }
}

/**
 * POST /api/contracts
 * Create a new contract (typically called from the award flow).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)
    await requirePermission('contract:create')

    const body = await request.json()
    const validated = createContractSchema.parse(body)

    // Override awardedBy with the current user's ID for security
    validated.awardedBy = ctx.userId
    validated.tenantId = ctx.tenantId

    const contract = await db.contract.create({
      data: {
        tenantId: validated.tenantId,
        rfpId: validated.rfpId,
        submissionId: validated.submissionId,
        vendorId: validated.vendorId,
        status: validated.status || "draft",
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        value: validated.value ?? null,
        terms: validated.terms ?? null,
        notes: validated.notes ?? null,
        awardedBy: validated.awardedBy,
      },
      include: {
        rfp: { select: { id: true, title: true } },
        vendor: { select: { id: true, name: true } },
        awardedByUser: { select: { id: true, name: true, email: true } },
      },
    })

    // Dispatch webhook for contract creation
    dispatchWebhooks('contract.created', {
      contractId: contract.id,
      rfpId: contract.rfpId,
      rfpTitle: contract.rfp.title,
      vendorId: contract.vendorId,
      vendorName: contract.vendor.name,
      status: contract.status,
      value: contract.value,
      awardedBy: ctx.userId,
    }, ctx.tenantId)

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("Error creating contract:", error)
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 })
  }
}
