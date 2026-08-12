"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, Zap } from "lucide-react"
import type { AuditLog, Integration, SystemHealth } from "../types"
import { getHealthStatusColor, getIntegrationStatusColor } from "../lib/admin-helpers"
import { formatDate } from "@/lib/utils"

export function DashboardTab({ auditLogs, integrations, systemHealth }: { auditLogs: AuditLog[], integrations: Integration[], systemHealth: SystemHealth | null }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Current system status and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge className={getHealthStatusColor(systemHealth?.status || "healthy")}>
                {systemHealth?.status || "Unknown"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Uptime</span>
              <span className="font-medium">{systemHealth?.uptime || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Response Time</span>
              <span className="font-medium">{systemHealth?.responseTime || 0}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active Users</span>
              <span className="font-medium">{systemHealth?.activeUsers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Database Size</span>
              <span className="font-medium">{systemHealth?.databaseSize || 0}GB</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Storage Used</span>
              <span className="font-medium">{systemHealth?.storageUsed || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Backup</span>
              <span className="font-medium">
                {systemHealth?.lastBackup ? formatDate(systemHealth.lastBackup) : "Never"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest system activities and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    <Activity className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.details}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Integration Status
          </CardTitle>
          <CardDescription>
            Status of connected third-party services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {integrations.map((integration) => (
              <div key={integration.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{integration.name}</h4>
                  <Badge className={getIntegrationStatusColor(integration.status)}>
                    {integration.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{integration.description}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{integration.usage.toLocaleString()} calls</span>
                  <span>{formatDate(integration.lastSync)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}