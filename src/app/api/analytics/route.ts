import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { AnalyticsService } from "@/lib/analytics-service"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const tenantContext = getTenantContext()

    switch (type) {
      case "full":
        const analyticsData = await AnalyticsService.getAnalyticsData(tenantContext.tenantId)
        return NextResponse.json(analyticsData)

      case "realtime":
        const realtimeMetrics = await AnalyticsService.getRealTimeMetrics(tenantContext.tenantId)
        return NextResponse.json(realtimeMetrics)

      default:
        return NextResponse.json({ error: "Invalid analytics type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}