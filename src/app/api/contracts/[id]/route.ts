import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"
import { dispatchWebhooks } from "@/lib/webhook-dispatcher"

const updateContractSchema = z.object({
  status: z.enum(['draft', 'active', 'completed', 'terminated', 'expired']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  value: z.number().min(0).optional(),
  terms: z.string().max(10000).optional(),
  notes: z.string().max(5000).optional(),
})

/**
 * GET /api/contracts/[id]
 * Get a single contract by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)
    const { id } = await params

    const contract = await db.contract.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        rfp: { select: { id: true, title: true, status: true, budget: true } },
        submission: { select: { id: true, status: true, version: true } },
        vendor: { select: { id: true, name: true, email: true, phone: true } },
        awardedByUser: { select: { id: true, name: true, email: true } },
      },
    })

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    return NextResponse.json(contract)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching contract:", error)
    return NextResponse.json({ error: "Failed to fetch contract" }, { status: 500 })
  }
}

/**
 * PUT /api/contracts/[id]
 * Update a contract's status, notes, terms, or dates.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)
    const { id } = await params

    // Verify contract belongs to tenant
    const existing = await db.contract.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateContractSchema.parse(body)

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.startDate !== undefined) updateData.startDate = new Date(validated.startDate)
    if (validated.endDate !== undefined) updateData.endDate = new Date(validated.endDate)
    if (validated.value !== undefined) updateData.value = validated.value
    if (validated.terms !== undefined) updateData.terms = validated.terms
    if (validated.notes !== undefined) updateData.notes = validated.notes

    const contract = await db.contract.update({
      where: { id },
      data: updateData,
      include: {
        rfp: { select: { id: true, title: true } },
        vendor: { select: { id: true, name: true } },
        awardedByUser: { select: { id: true, name: true, email: true } },
      },
    })

    // Dispatch webhook on contract status change
    if (validated.status && validated.status !== existing.status) {
      dispatchWebhooks('contract.status_changed', {
        contractId: contract.id,
        rfpId: contract.rfpId,
        rfpTitle: contract.rfp.title,
        vendorId: contract.vendorId,
        vendorName: contract.vendor.name,
        oldStatus: existing.status,
        newStatus: validated.status,
        updatedBy: ctx.userId,
      }, ctx.tenantId)
    }

    return NextResponse.json(contract)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("Error updating contract:", error)
    return NextResponse.json({ error: "Failed to update contract" }, { status: 500 })
  }
}
