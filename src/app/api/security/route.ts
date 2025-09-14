import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { SecurityService } from "@/lib/security-service"
import { TenantService } from "@/lib/tenant-service"
import { z } from "zod"

const updateConfigSchema = z.object({
  passwordPolicy: z.object({
    minLength: z.number().min(8).max(128),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSpecialChars: z.boolean(),
    expireDays: z.number().min(0).max(365),
  }).optional(),
  sessionPolicy: z.object({
    timeoutMinutes: z.number().min(5).max(1440),
    maxConcurrentSessions: z.number().min(1).max(10),
    requireMFA: z.boolean(),
  }).optional(),
  dataRetention: z.object({
    standard: z.number().min(1).max(10),
    short: z.number().min(1).max(5),
    deleted: z.number().min(1).max(365),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    const tenantContext = getTenantContext()

    // Check if user has admin permissions
    const hasAdminPermission = await TenantService.hasPermission(
      tenantContext.userId,
      tenantContext.tenantId,
      "admin:tenant"
    )

    if (!hasAdminPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    switch (action) {
      case "config":
        const config = await SecurityService.getTenantSecurityConfig(tenantContext.tenantId)
        return NextResponse.json(config)

      case "alerts":
        const status = searchParams.get("status") as any
        const severity = searchParams.get("severity") as any
        const limit = parseInt(searchParams.get("limit") || "50")
        const offset = parseInt(searchParams.get("offset") || "0")

        const alerts = await SecurityService.getSecurityAlerts(tenantContext.tenantId, {
          status,
          severity,
          limit,
          offset,
        })
        return NextResponse.json(alerts)

      case "compliance":
        const complianceReport = await SecurityService.getComplianceReport(tenantContext.tenantId)
        return NextResponse.json(complianceReport)

      case "scan":
        const scanResults = await SecurityService.runSecurityScan(tenantContext.tenantId)
        return NextResponse.json(scanResults)

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in security operation:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    const tenantContext = getTenantContext()

    // Check if user has admin permissions
    const hasAdminPermission = await TenantService.hasPermission(
      tenantContext.userId,
      tenantContext.tenantId,
      "admin:tenant"
    )

    if (!hasAdminPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    switch (action) {
      case "config":
        const body = await request.json()
        const validatedData = updateConfigSchema.parse(body)

        await SecurityService.updateTenantSecurityConfig(
          tenantContext.tenantId,
          validatedData
        )

        return NextResponse.json({ message: "Security configuration updated successfully" })

      case "resolve-alert":
        const alertId = searchParams.get("alertId")
        const resolutionBody = await request.json()

        if (!alertId) {
          return NextResponse.json({ error: "Alert ID is required" }, { status: 400 })
        }

        if (!resolutionBody.resolution) {
          return NextResponse.json({ error: "Resolution is required" }, { status: 400 })
        }

        await SecurityService.resolveSecurityAlert(
          alertId,
          tenantContext.tenantId,
          resolutionBody.resolution
        )

        return NextResponse.json({ message: "Alert resolved successfully" })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    console.error("Error in security operation:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    const tenantContext = getTenantContext()

    // Check if user has admin permissions
    const hasAdminPermission = await TenantService.hasPermission(
      tenantContext.userId,
      tenantContext.tenantId,
      "admin:tenant"
    )

    if (!hasAdminPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    switch (action) {
      case "scan":
        const scanResults = await SecurityService.runSecurityScan(tenantContext.tenantId)
        return NextResponse.json({
          message: "Security scan completed",
          results: scanResults,
        })

      case "encrypt":
        const encryptBody = await request.json()
        if (!encryptBody.data) {
          return NextResponse.json({ error: "Data to encrypt is required" }, { status: 400 })
        }

        const encrypted = SecurityService.encryptData(encryptBody.data)
        return NextResponse.json(encrypted)

      case "decrypt":
        const decryptBody = await request.json()
        if (!decryptBody.encrypted || !decryptBody.iv || !decryptBody.tag) {
          return NextResponse.json({ error: "Encrypted data, IV, and tag are required" }, { status: 400 })
        }

        try {
          const decrypted = SecurityService.decryptData(decryptBody.encrypted, decryptBody.iv, decryptBody.tag)
          return NextResponse.json({ decrypted })
        } catch (error) {
          return NextResponse.json({ error: "Failed to decrypt data" }, { status: 400 })
        }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in security operation:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}