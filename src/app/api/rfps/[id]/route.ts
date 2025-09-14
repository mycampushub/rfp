import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requirePermission } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/types/auth"
import { db } from "@/lib/db"

// GET /api/rfps/[id] - Get single RFP
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    
    const rfp = await db.rFP.findUnique({
      where: { id: params.id },
      include: {
        timeline: true,
        sections: {
          include: {
            questions: true,
          },
          orderBy: { order: "asc" },
        },
        teams: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        invitations: {
          include: {
            vendor: true,
          },
        },
        submissions: {
          include: {
            vendor: true,
            answers: {
              include: {
                question: true,
              },
            },
          },
        },
        qna: {
          include: {
            vendor: true,
          },
          orderBy: { createdAt: "desc" },
        },
        addenda: {
          orderBy: { createdAt: "desc" },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!rfp) {
      return NextResponse.json(
        { error: "RFP not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(rfp)
  } catch (error) {
    console.error("Error fetching RFP:", error)
    return NextResponse.json(
      { error: "Failed to fetch RFP" },
      { status: 500 }
    )
  }
}

// PATCH /api/rfps/[id] - Update RFP
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.EDIT_RFP)
    
    const body = await request.json()
    
    const rfp = await db.rFP.update({
      where: { id: params.id },
      data: body,
      include: {
        timeline: true,
      },
    })

    return NextResponse.json(rfp)
  } catch (error) {
    console.error("Error updating RFP:", error)
    return NextResponse.json(
      { error: "Failed to update RFP" },
      { status: 500 }
    )
  }
}

// DELETE /api/rfps/[id] - Delete RFP
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.DELETE_RFP)
    
    await db.rFP.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "RFP deleted successfully" })
  } catch (error) {
    console.error("Error deleting RFP:", error)
    return NextResponse.json(
      { error: "Failed to delete RFP" },
      { status: 500 }
    )
  }
}