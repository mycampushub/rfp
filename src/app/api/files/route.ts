import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { PERMISSIONS } from "@/types/auth"
import { FileService } from "@/lib/file-service"
import { z } from "zod"

export const dynamic = "force-dynamic"

const createFileSchema = z.object({
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)

    const tenantContext = getTenantContext(session)
    
    const options: Record<string, unknown> = {
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
    const metadata = formData.get("metadata") ? JSON.parse(formData.get("metadata") as string) : {}
    const createVersion = formData.get("createVersion") === "true"
    const parentFileId = formData.get("parentFileId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // File upload validation
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
    const ALLOWED_MIME_TYPES = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/zip",
      "text/plain",
      "text/csv",
    ]

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the maximum allowed size of 50MB" },
        { status: 413 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed. Allowed types: pdf, doc, docx, xls, xlsx, ppt, pptx, jpg, jpeg, png, gif, zip, txt, csv` },
        { status: 400 }
      )
    }

    const tenantContext = getTenantContext(session)
    await requirePermission(PERMISSIONS.MANAGE_FILES)

    const fileMetadata = {
      originalName: file.name,
      ...metadata,
    }

    const options: Record<string, unknown> = {}
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
