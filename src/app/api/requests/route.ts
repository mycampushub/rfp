import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const processId = searchParams.get("processId")
    const status = searchParams.get("status")
    const approverId = searchParams.get("approverId")
    const overdue = searchParams.get("overdue")
    const limit = Math.min(parseInt(searchParams.get('limit') || '10') || 10, 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)

    const tenantContext = getTenantContext(session)
    
    const whereClause: Record<string, unknown> = {
      process: {
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    }
    
    if (processId) {
      whereClause.processId = processId
    }
    if (status) {
      whereClause.status = status
    }
    if (approverId) {
      whereClause.approverId = approverId
    }
    if (overdue === "true") {
      whereClause.status = "pending"
      whereClause.dueAt = {
        lt: new Date(),
      }
    }

    const requests = await db.approvalRequest.findMany({
      where: whereClause,
      include: {
        process: {
          include: {
            rfp: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
            workflow: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(requests)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching requests:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
