import { MainLayout } from "@/components/layout/main-layout"
import { getTenantContextAsync } from "@/lib/tenant-context"
import { db } from "@/lib/db"
import { VendorsContent, type VendorData } from "./vendors-content"

export const dynamic = "force-dynamic"

export default async function VendorsPage() {
  let tenantId: string
  try {
    const ctx = await getTenantContextAsync()
    tenantId = ctx.tenantId
  } catch {
    return null
  }

  const vendors = await db.vendor.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      contactInfo: true,
      categories: true,
      certifications: true,
      diversityAttrs: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const vendorIds = vendors.map(v => v.id)

  // Fetch invitation counts per vendor
  const invitationCounts = vendorIds.length > 0
    ? await db.invitation.groupBy({
        by: ["vendorId"],
        where: { vendorId: { in: vendorIds } },
        _count: { id: true },
      })
    : []

  // Fetch submission counts per vendor
  const submissionCounts = vendorIds.length > 0
    ? await db.submission.groupBy({
        by: ["vendorId"],
        where: { vendorId: { in: vendorIds } },
        _count: { id: true },
      })
    : []

  const invMap = Object.fromEntries(invitationCounts.map(s => [s.vendorId, s._count.id]))
  const subMap = Object.fromEntries(submissionCounts.map(s => [s.vendorId, s._count.id]))

  const vendorsData = vendors.map(v => ({
    id: v.id,
    name: v.name,
    contactInfo: v.contactInfo as VendorData["contactInfo"],
    categories: v.categories as VendorData["categories"],
    certifications: v.certifications as string[] | null,
    diversityAttrs: v.diversityAttrs as VendorData["diversityAttrs"],
    isActive: v.isActive,
    createdAt: v.createdAt.toISOString(),
    invitationCount: invMap[v.id] ?? 0,
    submissionCount: subMap[v.id] ?? 0,
  }))

  return (
    <MainLayout title="Vendors">
      <VendorsContent vendors={vendorsData} />
    </MainLayout>
  )
}