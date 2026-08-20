import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError } from "@/lib/tenant-context"
import { buildCsv, csvResponse, jsonDataResponse } from "@/lib/csv-builder"

// GET /api/export/vendors?format=csv|json
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") ?? "csv"

    const vendorsRaw = await db.vendor.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
    })
    const vendors = vendorsRaw as any[]

    const headers = [
      "Company Name",
      "Contact Name",
      "Email",
      "Phone",
      "Category",
      "Status",
      "Created At",
      "Rating",
    ]

    const rows = vendors.map((v) => {
      // contactInfo is a Json field; try to extract contactName
      let contactName = ""
      if (v.contactInfo && typeof v.contactInfo === "object") {
        const info = v.contactInfo as Record<string, unknown>
        contactName = (info.contactName ?? info.name ?? "") as string
      }

      // categories is a Json field (array of strings)
      const categories = Array.isArray(v.categories)
        ? (v.categories as string[]).join("; ")
        : ""

      return [
        v.name,
        contactName,
        v.email ?? "",
        v.phone ?? "",
        categories,
        v.isActive ? "Active" : "Inactive",
        v.createdAt.toISOString(),
        v.rating,
      ]
    })

    if (format === "json") {
      return jsonDataResponse(
        vendors.map((v) => {
          let contactName = ""
          if (v.contactInfo && typeof v.contactInfo === "object") {
            const info = v.contactInfo as Record<string, unknown>
            contactName = (info.contactName ?? info.name ?? "") as string
          }
          return {
            companyName: v.name,
            contactName,
            email: v.email,
            phone: v.phone,
            category: Array.isArray(v.categories) ? v.categories : [],
            status: v.isActive ? "Active" : "Inactive",
            createdAt: v.createdAt.toISOString(),
            rating: v.rating,
          }
        })
      )
    }

    return csvResponse(buildCsv(headers, rows), "vendors-export.csv")
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error("Error exporting vendors:", error)
    return NextResponse.json({ error: "Failed to export vendors" }, { status: 500 })
  }
}
