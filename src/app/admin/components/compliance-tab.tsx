"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, CheckCircle, AlertTriangle, Plus, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import type { ComplianceFramework, ComplianceControl, ComplianceReport } from "../types"
import { getStatusColor, getComplianceStatusColor, getReportStatusColor } from "../lib/admin-helpers"
import { formatDate } from "@/lib/utils"

export function ComplianceTab({ complianceFrameworks, complianceControls, complianceReports, onViewFramework }: { complianceFrameworks: ComplianceFramework[], complianceControls: ComplianceControl[], complianceReports: ComplianceReport[], onViewFramework: (_framework: ComplianceFramework) => void }) {
  const [showAddFramework, setShowAddFramework] = useState(false)
  const [newFramework, setNewFramework] = useState({ name: "", description: "", version: "1.0" })

  const handleCreateFramework = async () => {
    if (!newFramework.name.trim()) { toast.error("Framework name is required"); return }
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'compliance_framework', ...newFramework }),
      })
      if (res.ok) {
        toast.success('Compliance framework created')
        setShowAddFramework(false)
        setNewFramework({ name: "", description: "", version: "1.0" })
      } else {
        toast.error('Failed to create framework')
      }
    } catch {
      toast.error('Failed to create framework')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Compliance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Compliance Overview
            </CardTitle>
            <CardDescription>
              Framework compliance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceFrameworks.map((framework) => (
                <div key={framework.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{framework.name}</h4>
                      <p className="text-xs text-muted-foreground">v{framework.version}</p>
                    </div>
                    <Badge className={getStatusColor(framework.status)}>
                      {framework.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Controls:</span>
                      <span>{framework.implementedControls}/{framework.controlsCount}</span>
                    </div>
                    <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(framework.implementedControls / framework.controlsCount) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((framework.implementedControls / framework.controlsCount) * 100)}% complete
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Recent Reports
            </CardTitle>
            <CardDescription>
              Latest compliance reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceReports.slice(0, 4).map((report) => (
                <div key={report.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{report.title}</h4>
                      <p className="text-xs text-muted-foreground">{report.framework}</p>
                    </div>
                    <Badge className={getReportStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Score: {report.score}%</span>
                    <span>{formatDate(report.generatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Controls Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Controls Status
            </CardTitle>
            <CardDescription>
              Control implementation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Implemented</span>
                <Badge className={getComplianceStatusColor('implemented')}>
                  {complianceControls.filter(c => c.status === 'implemented').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Partial</span>
                <Badge className={getComplianceStatusColor('partial')}>
                  {complianceControls.filter(c => c.status === 'partial').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Not Implemented</span>
                <Badge className={getComplianceStatusColor('not_implemented')}>
                  {complianceControls.filter(c => c.status === 'not_implemented').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Compliance Management */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Compliance Frameworks</CardTitle>
                <CardDescription>
                  Manage compliance frameworks and standards
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAddFramework(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Framework
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceFrameworks.map((framework) => (
                <div key={framework.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{framework.name}</h4>
                      <p className="text-sm text-muted-foreground">{framework.description}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => onViewFramework(framework)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Version {framework.version}</span>
                    <span>Updated {formatDate(framework.lastUpdated)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Compliance Controls</CardTitle>
                <CardDescription>
                  Manage individual compliance controls
                </CardDescription>
              </div>
              {/* TODO: Control creation requires a control type picker and criteria editor */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceControls.map((control) => (
                <div key={control.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{control.name}</h4>
                      <p className="text-xs text-muted-foreground">{control.category}</p>
                    </div>
                    <Badge className={getComplianceStatusColor(control.status)}>
                      {control.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground/80 mb-2">{control.description}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Next review: {formatDate(control.nextReview)}</span>
                    <span>{control.evidence.length} evidence files</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Framework Dialog */}
      <Dialog open={showAddFramework} onOpenChange={setShowAddFramework}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Compliance Framework</DialogTitle>
            <DialogDescription>Add a new compliance framework to track.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="framework-name">Name</Label>
              <Input id="framework-name" placeholder="e.g., SOC 2 Type II" value={newFramework.name} onChange={(e) => setNewFramework(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="framework-version">Version</Label>
              <Input id="framework-version" placeholder="1.0" value={newFramework.version} onChange={(e) => setNewFramework(prev => ({ ...prev, version: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="framework-desc">Description</Label>
              <Textarea id="framework-desc" placeholder="Framework description..." value={newFramework.description} onChange={(e) => setNewFramework(prev => ({ ...prev, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFramework(false)}>Cancel</Button>
            <Button onClick={handleCreateFramework}>Create Framework</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}