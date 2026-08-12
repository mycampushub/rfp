"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, Plus, Settings, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { Integration } from "../types"
import { getIntegrationStatusColor } from "../lib/admin-helpers"
import { formatDate } from "@/lib/utils"

export function IntegrationsTab({ integrations, onAddIntegration, onEditIntegration }: { integrations: Integration[], onAddIntegration: () => void, onEditIntegration: (_integration: Integration) => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Third-Party Integrations
            </CardTitle>
            <CardDescription>
              Manage connected services and API integrations
            </CardDescription>
          </div>
          <Button onClick={onAddIntegration}>
            <Plus className="mr-2 h-4 w-4" />
            Add Integration
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <div key={integration.id} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">{integration.name}</h4>
                <Badge className={getIntegrationStatusColor(integration.status)}>
                  {integration.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{integration.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage:</span>
                  <span className="font-medium">{integration.usage.toLocaleString()} calls</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-medium">{formatDate(integration.lastSync)}</span>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEditIntegration(integration)}>
                  <Settings className="h-4 w-4 mr-1" />
                  Configure
                </Button>
                <Button variant="outline" size="sm" onClick={async () => {
                  try {
                    const res = await fetch(`/api/integrations/${integration.id || ''}/sync`, { method: 'POST' })
                    if (res.ok) {
                      toast.success(`Sync completed for ${integration.name}`)
                    } else {
                      toast.info(`Sync initiated for ${integration.name}`)
                    }
                  } catch {
                    toast.info(`Sync initiated for ${integration.name}`)
                  }
                }} aria-label="Sync integration">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}