"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Loader2, Save, ArrowLeft, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface Vendor {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  website?: string | null
  location?: string | null
  description?: string | null
  categories?: string[] | null
  certifications?: string[] | null
  contactInfo?: Record<string, unknown> | null
  diversityAttrs?: Record<string, unknown> | null
  rating: number
  verified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface VendorFormData {
  name: string
  email: string
  phone: string
  website: string
  address: string
  categories: string
  description: string
  taxId: string
  complianceStatus: string
}

export default function VendorEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<VendorFormData>({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    categories: "",
    description: "",
    taxId: "",
    complianceStatus: "pending",
  })

  useEffect(() => {
    document.title = `Edit Vendor | RFP Platform`
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
        const ci = (data.contactInfo as Record<string, unknown>) ?? {}
        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          website: data.website ?? "",
          address: data.location ?? "",
          categories: Array.isArray(data.categories) ? data.categories.join(", ") : "",
          description: data.description ?? "",
          taxId: (ci.taxId as string) ?? "",
          complianceStatus: (ci.complianceStatus as string) ?? "pending",
        })
      } catch {
        setError("Failed to load vendor details")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchVendor()
  }, [id])

  const handleFieldChange = (field: keyof VendorFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Company name is required")
      return
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        location: form.address.trim() || null,
        categories: form.categories.trim()
          ? form.categories.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
      }

      const res = await fetch(`/api/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to update vendor")
      }

      toast.success("Vendor updated successfully")
      router.push(`/vendors/${id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="h-6 w-64 animate-pulse rounded bg-muted" />
          <Card>
            <CardHeader>
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-72 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-10 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </CardContent>
          </Card>
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

  return (
    <MainLayout hideBreadcrumbs>
      <div className="space-y-6 max-w-3xl">
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
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/vendors/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Vendor</h1>
            <p className="text-sm text-muted-foreground">Update vendor information and details</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core company details for this vendor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => handleFieldChange("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  placeholder="123 Main St, City, State"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classification</CardTitle>
            <CardDescription>Categories, certifications, and compliance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categories">Categories</Label>
              <Input
                id="categories"
                value={form.categories}
                onChange={(e) => handleFieldChange("categories", e.target.value)}
                placeholder="IT Services, Consulting, Construction (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">Separate multiple categories with commas</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={form.taxId}
                  onChange={(e) => handleFieldChange("taxId", e.target.value)}
                  placeholder="XX-XXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complianceStatus">Compliance Status</Label>
                <Select value={form.complianceStatus} onValueChange={(v) => handleFieldChange("complianceStatus", v)}>
                  <SelectTrigger id="complianceStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>Company overview and capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Describe the vendor's capabilities, experience, and areas of expertise..."
              rows={5}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Button variant="outline" onClick={() => router.push(`/vendors/${id}`)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
