"use client"

import { useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Upload, RefreshCw, Save } from "lucide-react"
import { toast } from "sonner"

interface CompanyTabProps {
  companyData: {
    name: string
    industry: string
    size: string
    website: string
    address: string
    phone: string
    description: string
  }
  tenantBranding: Record<string, string>
  isLoading: boolean
  setCompanyData: React.Dispatch<React.SetStateAction<{
    name: string
    industry: string
    size: string
    website: string
    address: string
    phone: string
    description: string
  }>>
  setTenantBranding: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onSave: () => void
}

export function CompanyTab({ companyData, tenantBranding, isLoading, setCompanyData, setTenantBranding, onSave }: CompanyTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="mr-2 h-5 w-5" />
          Company Information
        </CardTitle>
        <CardDescription>
          Manage your company profile and business details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyData.name}
              onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select value={companyData.industry} onValueChange={(value) => setCompanyData(prev => ({ ...prev, industry: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companySize">Company Size</Label>
            <Select value={companyData.size} onValueChange={(value) => setCompanyData(prev => ({ ...prev, size: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-500">201-500 employees</SelectItem>
                <SelectItem value="501-1000">501-1000 employees</SelectItem>
                <SelectItem value="1000-5000">1000-5000 employees</SelectItem>
                <SelectItem value="5000+">5000+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={companyData.website}
              onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyAddress">Company Address</Label>
          <Textarea
            id="companyAddress"
            value={companyData.address}
            onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
            rows={2}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyPhone">Company Phone</Label>
            <Input
              id="companyPhone"
              type="tel"
              value={companyData.phone}
              onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyDescription">Company Description</Label>
            <Textarea
              id="companyDescription"
              value={companyData.description}
              onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = async () => {
                  const dataUrl = reader.result as string
                  try {
                    const res = await fetch("/api/tenants/me", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        branding: { ...tenantBranding, logo: dataUrl },
                      }),
                    })
                    if (!res.ok) throw new Error("Failed to upload logo")
                    setTenantBranding(prev => ({ ...prev, logo: dataUrl }))
                    toast.success("Logo uploaded successfully")
                  } catch {
                    toast.error("Failed to upload logo")
                  }
                }
                reader.readAsDataURL(file)
                e.target.value = ""
              }}
            />
            <Upload className="mr-2 h-4 w-4" />
            Upload Logo
          </Button>
          <Button onClick={onSave} disabled={isLoading}>
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
