import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError } from "@/lib/tenant-context"
import { z } from "zod"

const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  isRequired: z.boolean().default(false),
  order: z.number(),
  questions: z.array(z.object({
    id: z.string().optional(),
    type: z.string(),
    prompt: z.string(),
    title: z.string().optional(),
    required: z.boolean().default(false),
    constraints: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.unknown())])).optional(),
    order: z.number(),
  })).default([]),
})

const syncSectionsSchema = z.object({
  sections: z.array(sectionSchema),
})

// PUT /api/rfps/[id]/sections - Replace all sections for an RFP
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
    const { sections } = syncSectionsSchema.parse(body)

    // Fetch existing section IDs (questions cascade-delete via onDelete: Cascade)
    const existingSections = await db.section.findMany({
      where: { rfpId: id },
      select: { id: true },
      take: 200,
    })
    const existingIds = (existingSections as Array<{ id: string }>).map((s: { id: string }) => s.id)

    // Delete all existing sections
    if (existingIds.length > 0) {
      await db.section.deleteMany({
        where: { rfpId: id },
      })
    }

    // Create new sections with their questions
    for (const section of sections) {
      const createdSection = await db.section.create({
        data: {
          rfpId: id,
          title: section.title,
          description: section.description,
          isRequired: section.isRequired,
          order: section.order,
        },
      })

      for (let qIdx = 0; qIdx < section.questions.length; qIdx++) {
        const q = section.questions[qIdx]
        await db.question.create({
          data: {
            sectionId: createdSection.id,
            type: q.type || "text",
            prompt: q.prompt || q.title || "",
            required: q.required ?? false,
            constraints: q.constraints as any || undefined,
            order: qIdx,
          },
        })
      }
    }

    const updatedSections = await db.section.findMany({
      where: { rfpId: id },
      include: { questions: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
      take: 200,
    })

    return NextResponse.json(updatedSections)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error syncing sections:", error)
    return NextResponse.json({ error: "Failed to update sections" }, { status: 500 })
  }
}
