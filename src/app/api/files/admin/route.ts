import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { FileService } from "@/lib/file-service"
import { TenantService } from "@/lib/tenant-service"

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
      case "stats":
        const stats = await FileService.getStorageStats(tenantContext.tenantId)
        return NextResponse.json(stats)

      case "integrity":
        const integrity = await FileService.checkIntegrity()
        return NextResponse.json(integrity)

      case "retention":
        const retentionResults = await FileService.applyRetentionPolicies()
        return NextResponse.json(retentionResults)

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in file admin operation:", error)
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
      case "retention":
        const retentionResults = await FileService.applyRetentionPolicies()
        return NextResponse.json({
          message: "Retention policies applied successfully",
          results: retentionResults,
        })

      case "integrity":
        const integrityResults = await FileService.checkIntegrity()
        const corruptedFiles = integrityResults.filter(r => !r.isIntact)
        
        return NextResponse.json({
          message: "Integrity check completed",
          totalFiles: integrityResults.length,
          corruptedFiles: corruptedFiles.length,
          results: integrityResults,
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in file admin operation:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}