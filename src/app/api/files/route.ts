import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { FileService } from "@/lib/file-service"
import { z } from "zod"

const _createFileSchema = z.object({
  filename: z.string(),
  size: z.number(),
  mime: z.string(),
  retention: z.string().optional(),
  legalHold: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const retention = searchParams.get("retention")
    const legalHold = searchParams.get("legalHold")
    const accessLevel = searchParams.get("accessLevel")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const tenantContext = getTenantContext(session)
    
    const options: any = {
      limit,
      offset,
    }

    if (category) options.category = category
    if (retention) options.retention = retention
    if (accessLevel) options.accessLevel = accessLevel
    if (legalHold !== null) {
      // This would need to be handled in the FileService
      options.legalHold = legalHold === "true"
    }

    const result = await FileService.getFilesByTenant(tenantContext.tenantId, options)

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const rawMetadata = formData.get("metadata") as string
    let metadata: Record<string, unknown> = {}
    if (rawMetadata) {
      try {
        metadata = JSON.parse(rawMetadata)
      } catch {
        metadata = {}
      }
    }
    const createVersion = formData.get("createVersion") === "true"
    const parentFileId = formData.get("parentFileId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const tenantContext = getTenantContext(session)

    const fileMetadata = {
      originalName: file.name,
      ...metadata,
    }

    const options: any = {}
    if (createVersion) {
      options.createVersion = true
      if (parentFileId) {
        options.parentFileId = parentFileId
      }
    }

    const fileRecord = await FileService.uploadFile(
      file,
      fileMetadata,
      tenantContext.tenantId,
      tenantContext.userId,
      options
    )

    return NextResponse.json(fileRecord, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}