"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Eye, Edit, Settings } from "lucide-react"
import type { Tenant } from "../types"
import { getStatusColor, getPlanColor } from "../lib/admin-helpers"
import { formatDate } from "@/lib/utils"

export function TenantsTab({ tenants, onAddTenant, onViewTenant, onEditTenant, onSettings }: { tenants: Tenant[], onAddTenant: () => void, onViewTenant: (_tenant: Tenant) => void, onEditTenant: (_tenant: Tenant) => void, onSettings: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Tenant Management</CardTitle>
            <CardDescription>
              Manage multi-tenant organizations
            </CardDescription>
          </div>
          <Button onClick={onAddTenant}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{tenant.name}</h4>
                    <Badge className={getPlanColor(tenant.plan)}>
                      {tenant.plan}
                    </Badge>
                    <Badge className={getStatusColor(tenant.status)}>
                      {tenant.status}
                    </Badge>
                  </div>
                  <div className="flex space-x-4 text-sm text-muted-foreground">
                    <span>{tenant.userCount} users</span>
                    <span>{tenant.rfpCount} RFPs</span>
                    <span>Created: {formatDate(tenant.createdAt)}</span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => onViewTenant(tenant)} aria-label="View tenant">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditTenant(tenant)} aria-label="Edit tenant">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onSettings} aria-label="Tenant settings">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {tenant.settings.branding && (
                <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                  <strong>Branding:</strong> {tenant.settings.branding.primaryColor && (
                    <span className="ml-2">Primary: {tenant.settings.branding.primaryColor}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}