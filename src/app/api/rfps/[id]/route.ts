import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"

export const dynamic = "force-dynamic"

const updateRFPSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().optional(),
  budget: z.number().optional(),
  confidentiality: z.enum(["internal", "confidential", "restricted"]).optional(),
  status: z.enum(["draft", "published", "closed", "awarded", "archived"]).optional(),
  isPublic: z.boolean().optional(),
  publishAt: z.string().optional(),
  closeAt: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
})

// GET /api/rfps/[id] - Get single RFP
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const rfp = await db.rFP.findFirst({
      where: { id: params.id, tenantId: ctx.tenantId },
      include: {
        timeline: true,
        sections: { include: { questions: true }, orderBy: { order: "asc" } },
        teams: { include: { user: { select: { id: true, name: true, email: true } } } },
        invitations: { include: { vendor: true } },
        submissions: { include: { vendor: true, answers: { include: { question: true } } } },
        qna: { include: { vendor: true }, orderBy: { createdAt: "desc" } },
        addenda: { orderBy: { createdAt: "desc" } },
        approvals: { include: { approver: { select: { id: true, name: true, email: true } } } },
      },
    })

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }
    return NextResponse.json(rfp)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error fetching RFP:", error)
    return NextResponse.json({ error: "Failed to fetch RFP" }, { status: 500 })
  }
}

// PATCH /api/rfps/[id] - Update RFP
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)
    await requirePermission("rfp:edit")

    const body = await request.json()
    const validatedData = updateRFPSchema.parse(body)

    const existing = await db.rFP.findFirst({
      where: { id: params.id, tenantId: ctx.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { ...validatedData }
    if (validatedData.publishAt) updateData.publishAt = new Date(validatedData.publishAt)
    if (validatedData.closeAt) updateData.closeAt = new Date(validatedData.closeAt)

    const rfp = await db.rFP.update({
      where: { id: params.id },
      data: updateData,
      include: { timeline: true },
    })
    return NextResponse.json(rfp)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error updating RFP:", error)
    return NextResponse.json({ error: "Failed to update RFP" }, { status: 500 })
  }
}

// DELETE /api/rfps/[id] - Delete RFP
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)
    await requirePermission("rfp:delete")

    const existing = await db.rFP.findFirst({
      where: { id: params.id, tenantId: ctx.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }

    await db.rFP.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "RFP deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting RFP:", error)
    return NextResponse.json({ error: "Failed to delete RFP" }, { status: 500 })
  }
}
