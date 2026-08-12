import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantContext, AuthError } from "@/lib/tenant-context"
import { writeFile, mkdir } from "fs/promises"
import { join, extname } from "path"
import { randomUUID } from "crypto"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".gif", ".csv", ".txt", ".zip",
])
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".gif": ["image/gif"],
  ".csv": ["text/csv", "application/vnd.ms-excel"],
  ".txt": ["text/plain"],
  ".zip": ["application/zip", "application/x-zip-compressed"],
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)
    if (!ctx.tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    if (files.length > 20) {
      return NextResponse.json({ error: "Maximum 20 files per upload" }, { status: 400 })
    }

    const results: Array<{
      url: string
      filename: string
      originalName: string
      size: number
      mimeType: string
    }> = []

    const errors: Array<{ filename: string; error: string }> = []

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push({ filename: file.name, error: `File exceeds maximum size of 10MB (${(file.size / 1024 / 1024).toFixed(1)}MB)` })
        continue
      }

      const ext = extname(file.name).toLowerCase()
      if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
        errors.push({ filename: file.name, error: `File type "${ext || 'unknown'}" is not supported` })
        continue
      }

      // Validate MIME type
      const allowedMimes = ALLOWED_MIME_TYPES[ext]
      if (allowedMimes && !allowedMimes.includes(file.type)) {
        errors.push({ filename: file.name, error: `MIME type "${file.type}" does not match file extension "${ext}"` })
        continue
      }

      try {
        // Generate unique filename with tenant prefix
        const uniqueName = `${ctx.tenantId}_${randomUUID()}${ext}`
        const uploadDir = join(process.cwd(), "public", "uploads")
        await mkdir(uploadDir, { recursive: true })

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filePath = join(uploadDir, uniqueName)
        await writeFile(filePath, buffer)

        results.push({
          url: `/uploads/${uniqueName}`,
          filename: uniqueName,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
        })
      } catch (err) {
        errors.push({ filename: file.name, error: "Failed to save file" })
      }
    }

    if (results.length === 0 && errors.length > 0) {
      // If ALL files failed, check for specific errors to return proper status codes
      const hasSizeError = errors.some(e => e.error.includes("exceeds maximum size"))
      const hasTypeError = errors.some(e => e.error.includes("not supported") || e.error.includes("does not match"))
      if (hasSizeError) {
        return NextResponse.json({ error: "File too large", details: errors }, { status: 413 })
      }
      if (hasTypeError) {
        return NextResponse.json({ error: "Unsupported file type", details: errors }, { status: 415 })
      }
      return NextResponse.json({ error: "All files failed to upload", details: errors }, { status: 400 })
    }

    return NextResponse.json({
      urls: results.map(r => r.url),
      files: results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
