import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac"
import { db } from "@/lib/db"
import { AuditLogger, AUDIT_EVENTS } from "@/lib/audit-logger"
import { z } from "zod"
import type { TransactionClient } from "@/lib/consensus-calculator"

const awardSchema = z.object({
  submissionId: z.string().min(1),
  notes: z.string().max(5000).optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  contractValue: z.number().min(0).optional(),
})

/**
 * POST /api/rfps/[id]/award
 *
 * Awards a vendor for an RFP, creates a contract record, and updates statuses.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rfpId } = await params
    const { ctx } = await requirePermission("rfp:award")

    const body = await request.json()
    const validated = awardSchema.parse(body)

    const { submissionId, notes, contractStartDate, contractEndDate, contractValue } = validated

    // Verify RFP belongs to tenant and has appropriate status
    const rfp = await db.rFP.findFirst({
      where: { id: rfpId, tenantId: ctx.tenantId },
    })

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }

    if (!["closed", "published"].includes(rfp.status)) {
      return NextResponse.json(
        { error: "RFP must be in 'closed' or 'published' status to award" },
        { status: 400 }
      )
    }

    // Verify submission belongs to this RFP
    const submission = await db.submission.findFirst({
      where: { id: submissionId, rfpId },
      include: {
        vendor: { select: { id: true, name: true } },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found for this RFP" }, { status: 404 })
    }

    if (submission.status === "awarded") {
      return NextResponse.json({ error: "This submission has already been awarded" }, { status: 400 })
    }

    // Perform the award in a transaction
    const result = await db.$transaction(async (tx: TransactionClient) => {
      // Mark the submission as awarded
      const awardedSubmission = await tx.submission.update({
        where: { id: submissionId },
        data: { status: "awarded" },
        include: {
          vendor: true,
          rfp: { select: { title: true } },
        },
      })

      // Create the contract record
      const contract = await tx.contract.create({
        data: {
          tenantId: ctx.tenantId,
          rfpId,
          submissionId,
          vendorId: submission.vendorId,
          status: "draft",
          startDate: contractStartDate ? new Date(contractStartDate) : null,
          endDate: contractEndDate ? new Date(contractEndDate) : null,
          value: contractValue ?? null,
          terms: null,
          notes: notes ?? null,
          awardedBy: ctx.userId,
        },
        include: {
          rfp: { select: { title: true } },
          vendor: { select: { name: true } },
          awardedByUser: { select: { name: true, email: true } },
        },
      })

      // Update RFP status to 'awarded'
      await tx.rFP.update({
        where: { id: rfpId },
        data: { status: "awarded" },
      })

      return { submission: awardedSubmission, contract }
    })

    // Create audit log entries
    await AuditLogger.log({
      action: AUDIT_EVENTS.RFP_AWARDED,
      targetType: "RFP",
      targetId: rfpId,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      metadata: {
        submissionId,
        vendorId: submission.vendorId,
        vendorName: submission.vendor.name,
        contractId: result.contract.id,
        contractValue,
        contractStartDate,
        contractEndDate,
        notes,
      },
    })

    return NextResponse.json({
      message: "Vendor awarded successfully",
      contract: result.contract,
      submission: result.submission,
    }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("Error awarding vendor:", error)
    return NextResponse.json({ error: "Failed to award vendor" }, { status: 500 })
  }
}
