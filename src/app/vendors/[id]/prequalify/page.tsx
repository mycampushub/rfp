"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { LoadingCards } from "@/components/shared/loading-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Shield, AlertCircle, CheckCircle, Clock, XCircle, FileCheck, HelpCircle } from "lucide-react"

interface Vendor {
  id: string
  name: string
  verified: boolean
  certifications?: string[] | null
  contactInfo?: Record<string, unknown> | null
  diversityAttrs?: Record<string, unknown> | null
  createdAt: string
}

// Derive prequalification status from available vendor data
function derivePrequalificationStatus(vendor: Vendor): "approved" | "pending" | "rejected" | "expired" {
  const ci = vendor.contactInfo ?? {}
  const complianceStatus = (ci.complianceStatus as string) ?? null
  if (complianceStatus && ["approved", "pending", "rejected", "expired"].includes(complianceStatus)) {
    return complianceStatus as "approved" | "pending" | "rejected" | "expired"
  }
  if (vendor.verified) return "approved"
  return "pending"
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  approved: { label: "Approved", icon: CheckCircle, color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  pending: { label: "Pending Review", icon: Clock, color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
  expired: { label: "Expired", icon: AlertCircle, color: "bg-muted text-muted-foreground border-muted" },
}

export default function VendorPrequalifyPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = `Vendor Prequalification | RFP Platform`
  }, [])

  useEffect(() => {
    async function fetchVendor() {
      try {
        const res = await fetch(`/api/vendors/${id}`)
        if (!res.ok) {
          if (res.status === 404) setError("Vendor not found")
          else throw new Error("Failed to fetch vendor")
          return
        }
        const data = await res.json()
        setVendor(data)
      } catch {
        setError("Failed to load vendor details")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchVendor()
  }, [id])

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="h-6 w-64 animate-pulse rounded bg-muted" />
          <LoadingCards count={3} />
          <div className="rounded-lg border p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${40 + Math.random() * 60}%` }} />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !vendor) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || "Vendor not found"}</p>
          <Button variant="outline" onClick={() => router.push("/vendors")}>
            Back to Vendors
          </Button>
        </div>
      </MainLayout>
    )
  }

  const prequalStatus = derivePrequalificationStatus(vendor)
  const statusConf = statusConfig[prequalStatus]
  const StatusIcon = statusConf.icon
  const ci = vendor.contactInfo ?? {}

  // Build requirements checklist from available vendor data
  const requirements = [
    {
      label: "Business Information Complete",
      met: !!(vendor.name && (ci.businessType || ci.yearFounded)),
    },
    {
      label: "Tax ID Provided",
      met: !!(ci.taxId as string),
    },
    {
      label: "Insurance on File",
      met: !!(ci.insurance as string),
    },
    {
      label: "Business License Verified",
      met: !!(ci.licenseNumber as string),
    },
    {
      label: "Background Check Completed",
      met: ci.backgroundCheck === true,
    },
    {
      label: "NDA Signed",
      met: ci.ndaSigned === true,
    },
    {
      label: "Certifications Provided",
      met: vendor.certifications && vendor.certifications.length > 0,
    },
    {
      label: "Diversity Attributes Declared",
      met: vendor.diversityAttrs !== null && Object.values(vendor.diversityAttrs ?? {}).some(Boolean),
    },
  ]

  const metCount = requirements.filter(r => r.met).length
  const totalCount = requirements.length

  return (
    <MainLayout hideBreadcrumbs>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendors">Vendors</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/vendors/${id}`}>{vendor.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Prequalification</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold">Prequalification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review {vendor.name}&apos;s prequalification status and requirements
          </p>
        </div>

        {/* Current Status Card */}
        <Card className={statusConf.color}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <StatusIcon className="h-10 w-10 shrink-0" />
              <div>
                <h2 className="text-lg font-semibold">Status: {statusConf.label}</h2>
                <p className="text-sm opacity-80">
                  {prequalStatus === "approved" && "This vendor has been fully prequalified and is eligible for RFP invitations."}
                  {prequalStatus === "pending" && "This vendor's prequalification is under review. Some requirements may still be pending."}
                  {prequalStatus === "rejected" && "This vendor did not meet the prequalification requirements."}
                  {prequalStatus === "expired" && "This vendor's prequalification has expired and needs to be renewed."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4" /> Requirements Checklist
            </CardTitle>
            <CardDescription>
              {metCount} of {totalCount} requirements met
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${metCount === totalCount ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${totalCount > 0 ? (metCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="space-y-3">
              {requirements.map((req) => (
                <div key={req.label} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {req.met ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm">{req.label}</span>
                  </div>
                  <Badge variant={req.met ? "secondary" : "outline"} className={req.met ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : ""}>
                    {req.met ? "Met" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              {vendor.certifications && vendor.certifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {vendor.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary">{cert}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No certifications on file</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Diversity Classification</CardTitle>
            </CardHeader>
            <CardContent>
              {vendor.diversityAttrs ? (
                <div className="space-y-2">
                  {Object.entries(vendor.diversityAttrs).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <Badge variant={value ? "secondary" : "outline"} className={value ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : ""}>
                        {value ? "Yes" : "No"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No diversity attributes declared</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
