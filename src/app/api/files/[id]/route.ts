import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { FileService } from "@/lib/file-service"
import { z } from "zod"

const updateFileSchema = z.object({
  retention: z.string().optional(),
  legalHold: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const tenantContext = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const version = searchParams.get("version") ? parseInt(searchParams.get("version")!) : undefined
    const download = searchParams.get("download") === "true"

    const result = await FileService.getFile(id, tenantContext.tenantId, version)

    if (download) {
      return new NextResponse(result.content, {
        headers: {
          "Content-Type": result.file.mime || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${result.file.metadata?.originalName || result.file.path}"`,
        },
      })
    }

    return NextResponse.json(result.file)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching file:", error)
    if (error.message === "File not found" || error.message === "Version not found") {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateFileSchema.parse(body)

    const tenantContext = getTenantContext(session)

    // For now, we'll just update the metadata in the database
    // In a real implementation, you might want to use the FileService for this
    const db = await import("@/lib/db").then(m => m.db)
    
    const existingFile = await db.file.findFirst({
      where: {
        id: id,
        tenantId: tenantContext.tenantId,
      },
    })

    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = await db.file.update({
      where: { id: id },
      data: {
        ...validatedData,
        metadata: {
          ...existingFile.metadata,
          ...validatedData.metadata,
          lastModifiedBy: tenantContext.userId,
          lastModifiedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json(file)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error updating file:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get("permanent") === "true"

    const tenantContext = getTenantContext(session)

    await FileService.deleteFile(id, tenantContext.tenantId, tenantContext.userId, permanent)

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting file:", error)
    if (error.message === "File not found") {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message === "Cannot delete file under legal hold") {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}