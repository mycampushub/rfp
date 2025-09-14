import { db } from "@/lib/db"
import { writeFile, readFile, unlink } from "fs/promises"
import { join } from "path"
import { createHash } from "crypto"
import { v4 as uuidv4 } from "uuid"

export interface FileVersion {
  id: string
  version: number
  path: string
  sha256: string
  size: number
  mime: string
  createdAt: Date
  createdBy: string
  changelog?: string
}

export interface FileMetadata {
  originalName: string
  description?: string
  tags?: string[]
  category?: string
  retentionPolicy?: string
  legalHold?: boolean
  accessLevel?: "public" | "internal" | "confidential" | "restricted"
}

export class FileService {
  static async uploadFile(
    file: File,
    metadata: FileMetadata,
    tenantId: string,
    userId: string,
    options?: {
      createVersion?: boolean
      parentFileId?: string
    }
  ) {
    const { createVersion = false, parentFileId } = options || {}

    // Generate unique file path
    const fileId = parentFileId || uuidv4()
    const fileExtension = metadata.originalName.split(".").pop()
    const fileName = `${fileId}.${fileExtension}`
    const filePath = join(process.cwd(), "vault", fileName)

    // Ensure vault directory exists
    const fs = await import("fs")
    const vaultDir = join(process.cwd(), "vault")
    if (!fs.existsSync(vaultDir)) {
      fs.mkdirSync(vaultDir, { recursive: true })
    }

    // Write file to vault
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Calculate SHA256 hash
    const sha256 = createHash("sha256").update(buffer).digest("hex")

    if (createVersion && parentFileId) {
      // Create new version of existing file
      const existingFile = await db.file.findUnique({
        where: { id: parentFileId },
      })

      if (!existingFile) {
        throw new Error("Parent file not found")
      }

      const newVersion = existingFile.version + 1

      // Update existing file record
      const updatedFile = await db.file.update({
        where: { id: parentFileId },
        data: {
          version: newVersion,
          path: fileName,
          sha256,
          size: file.size,
          mime: file.type,
          metadata: {
            ...existingFile.metadata,
            ...metadata,
            versions: [
              ...(existingFile.metadata?.versions || []),
              {
                version: existingFile.version,
                path: existingFile.path,
                sha256: existingFile.sha256,
                size: existingFile.size,
                createdAt: existingFile.createdAt,
                createdBy: existingFile.metadata?.uploadedBy,
              },
            ],
          },
        },
      })

      return updatedFile
    } else {
      // Create new file record
      const fileRecord = await db.file.create({
        data: {
          id: fileId,
          tenantId,
          path: fileName,
          sha256,
          size: file.size,
          mime: file.type,
          version: 1,
          retention: metadata.retentionPolicy || "standard",
          legalHold: metadata.legalHold || false,
          metadata: {
            ...metadata,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            versions: [],
          },
        },
      })

      return fileRecord
    }
  }

  static async getFile(fileId: string, tenantId: string, version?: number) {
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        tenantId,
      },
    })

    if (!file) {
      throw new Error("File not found")
    }

    let filePath = join(process.cwd(), "vault", file.path)
    let fileRecord = file

    // If specific version requested, get that version
    if (version && version !== file.version) {
      const versionData = file.metadata?.versions?.find((v: any) => v.version === version)
      if (!versionData) {
        throw new Error("Version not found")
      }
      filePath = join(process.cwd(), "vault", versionData.path)
      
      // Create a temporary file record for the version
      fileRecord = {
        ...file,
        version: versionData.version,
        path: versionData.path,
        sha256: versionData.sha256,
        size: versionData.size,
        createdAt: versionData.createdAt,
      }
    }

    const fileContent = await readFile(filePath)
    
    return {
      file: fileRecord,
      content: fileContent,
    }
  }

  static async deleteFile(fileId: string, tenantId: string, userId: string, permanent: boolean = false) {
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        tenantId,
      },
    })

    if (!file) {
      throw new Error("File not found")
    }

    if (file.legalHold) {
      throw new Error("Cannot delete file under legal hold")
    }

    if (permanent) {
      // Delete all versions from disk
      const versions = [
        {
          path: file.path,
        },
        ...(file.metadata?.versions || []),
      ]

      for (const version of versions) {
        const filePath = join(process.cwd(), "vault", version.path)
        const fs = await import("fs")
        if (fs.existsSync(filePath)) {
          await unlink(filePath)
        }
      }

      await db.file.delete({
        where: { id: fileId },
      })
    } else {
      // Soft delete - mark for retention cleanup
      await db.file.update({
        where: { id: fileId },
        data: {
          retention: "deleted",
          metadata: {
            ...file.metadata,
            deletedBy: userId,
            deletedAt: new Date().toISOString(),
          },
        },
      })
    }
  }

  static async getFilesByTenant(
    tenantId: string,
    options?: {
      category?: string
      tags?: string[]
      accessLevel?: string
      retention?: string
      limit?: number
      offset?: number
    }
  ) {
    const where: any = {
      tenantId,
    }

    if (options?.category) {
      where.metadata = {
        path: ["category"],
        equals: options.category,
      }
    }

    if (options?.retention) {
      where.retention = options.retention
    }

    const [files, total] = await Promise.all([
      db.file.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      db.file.count({ where }),
    ])

    return { files, total }
  }

  static async applyRetentionPolicies() {
    const now = new Date()
    
    // Get files that need to be cleaned up
    const filesToCleanup = await db.file.findMany({
      where: {
        OR: [
          // Standard retention: 7 years
          {
            retention: "standard",
            createdAt: {
              lt: new Date(now.getFullYear() - 7, now.getMonth(), now.getDate()),
            },
          },
          // Short retention: 1 year
          {
            retention: "short",
            createdAt: {
              lt: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
            },
          },
          // Deleted files: 30 days
          {
            retention: "deleted",
            metadata: {
              path: ["deletedAt"],
              lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        ],
        legalHold: false,
      },
    })

    const cleanupResults = []
    
    for (const file of filesToCleanup) {
      try {
        // Delete all versions from disk
        const versions = [
          {
            path: file.path,
          },
          ...(file.metadata?.versions || []),
        ]

        for (const version of versions) {
          const filePath = join(process.cwd(), "vault", version.path)
          const fs = await import("fs")
          if (fs.existsSync(filePath)) {
            await unlink(filePath)
          }
        }

        await db.file.delete({
          where: { id: file.id },
        })

        cleanupResults.push({
          fileId: file.id,
          status: "success",
        })
      } catch (error) {
        cleanupResults.push({
          fileId: file.id,
          status: "error",
          error: error.message,
        })
      }
    }

    return cleanupResults
  }

  static async checkIntegrity() {
    const files = await db.file.findMany({
      select: {
        id: true,
        path: true,
        sha256: true,
        size: true,
      },
    })

    const integrityResults = []

    for (const file of files) {
      try {
        const filePath = join(process.cwd(), "vault", file.path)
        const fileContent = await readFile(filePath)
        
        // Calculate current hash
        const currentHash = createHash("sha256").update(fileContent).digest("hex")
        const currentSize = fileContent.length

        const isIntact = currentHash === file.sha256 && currentSize === file.size

        integrityResults.push({
          fileId: file.id,
          path: file.path,
          isIntact,
          hashMatch: currentHash === file.sha256,
          sizeMatch: currentSize === file.size,
          currentHash,
          currentSize,
          expectedHash: file.sha256,
          expectedSize: file.size,
        })
      } catch (error) {
        integrityResults.push({
          fileId: file.id,
          path: file.path,
          isIntact: false,
          error: error.message,
        })
      }
    }

    return integrityResults
  }

  static async getStorageStats(tenantId: string) {
    const files = await db.file.findMany({
      where: { tenantId },
      select: {
        size: true,
        retention: true,
        legalHold: true,
        createdAt: true,
      },
    })

    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0)
    const totalFiles = files.length

    const byRetention = files.reduce((acc, file) => {
      const retention = file.retention || "unknown"
      acc[retention] = (acc[retention] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byLegalHold = files.reduce((acc, file) => {
      const status = file.legalHold ? "held" : "not_held"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byMonth = files.reduce((acc, file) => {
      const month = file.createdAt.toISOString().substring(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalSize,
      totalFiles,
      byRetention,
      byLegalHold,
      byMonth,
    }
  }
}