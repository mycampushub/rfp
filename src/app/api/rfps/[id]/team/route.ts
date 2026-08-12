import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError } from "@/lib/tenant-context"
import { z } from "zod"

const teamMemberSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.string().default("viewer"),
})

const syncTeamSchema = z.object({
  members: z.array(teamMemberSchema),
})

// PUT /api/rfps/[id]/team - Replace all team members for an RFP
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const ctx = getTenantContext(session)

    const rfp = await db.rFP.findFirst({
      where: { id: id, tenantId: ctx.tenantId },
    })
    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 })
    }

    const body = await request.json()
    const { members } = syncTeamSchema.parse(body)

    // Delete all existing team members
    await db.rFP_Team.deleteMany({
      where: { rfpId: id },
    })

    // Create new team members
    // Look up users by email and create team entries
    const teamEntries = []
    for (const member of members) {
      const user = await db.user.findFirst({
        where: { email: member.email, tenantId: ctx.tenantId },
      })

      if (user) {
        try {
          const entry = await db.rFP_Team.create({
            data: {
              rfpId: id,
              userId: user.id,
              role: member.role || "viewer",
            },
          })
          teamEntries.push(entry)
        } catch {
          // Handle unique constraint violations (same user added twice)
          // Skip duplicates silently
        }
      }
      // If no user found with that email, skip (they need to exist in the system)
    }

    const updatedTeam = await db.rFP_Team.findMany({
      where: { rfpId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      take: 200,
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error syncing team:", error)
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}
