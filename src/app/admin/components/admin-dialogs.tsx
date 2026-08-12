"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import type { User, Role, Tenant, Integration, ComplianceFramework, AuditLog } from "../types"
import { getStatusColor, getPlanColor, ALL_PERMISSIONS } from "../lib/admin-helpers"
import { formatDate } from "@/lib/utils"

interface AdminDialogsProps {
  // User dialogs
  showViewUserDialog: boolean
  setShowViewUserDialog: (_open: boolean) => void
  showCreateUserDialog: boolean
  setShowCreateUserDialog: (_open: boolean) => void
  showEditUserDialog: boolean
  setShowEditUserDialog: (_open: boolean) => void
  selectedUser: User | null
  // Role dialogs
  showCreateRoleDialog: boolean
  setShowCreateRoleDialog: (_open: boolean) => void
  showEditRoleDialog: boolean
  setShowEditRoleDialog: (_open: boolean) => void
  showDeleteRoleDialog: boolean
  setShowDeleteRoleDialog: (_open: boolean) => void
  selectedRole: Role | null
  // Tenant dialogs
  showCreateTenantDialog: boolean
  setShowCreateTenantDialog: (_open: boolean) => void
  showViewTenantDialog: boolean
  setShowViewTenantDialog: (_open: boolean) => void
  showEditTenantDialog: boolean
  setShowEditTenantDialog: (_open: boolean) => void
  selectedTenant: Tenant | null
  // Integration dialogs
  showCreateIntegrationDialog: boolean
  setShowCreateIntegrationDialog: (_open: boolean) => void
  showEditIntegrationDialog: boolean
  setShowEditIntegrationDialog: (_open: boolean) => void
  selectedIntegration: Integration | null
  // Framework/Audit dialogs
  showViewFrameworkDialog: boolean
  setShowViewFrameworkDialog: (_open: boolean) => void
  selectedFramework: ComplianceFramework | null
  showViewAuditDialog: boolean
  setShowViewAuditDialog: (_open: boolean) => void
  selectedAuditLog: AuditLog | null
  // Form data
  formData: Record<string, string | string[]>
  setFormData: (_data: Record<string, string | string[]>) => void
  rolePermissions: string[]
  setRolePermissions: (_perms: string[]) => void
  // Data for selects
  roles: Role[]
  tenants: Tenant[]
  // Callbacks
  fetchData: () => void
}

export function AdminDialogs({
  showViewUserDialog, setShowViewUserDialog,
  showCreateUserDialog, setShowCreateUserDialog,
  showEditUserDialog, setShowEditUserDialog,
  selectedUser,
  showCreateRoleDialog, setShowCreateRoleDialog,
  showEditRoleDialog, setShowEditRoleDialog,
  showDeleteRoleDialog, setShowDeleteRoleDialog,
  selectedRole,
  showCreateTenantDialog, setShowCreateTenantDialog,
  showViewTenantDialog, setShowViewTenantDialog,
  showEditTenantDialog, setShowEditTenantDialog,
  selectedTenant,
  showCreateIntegrationDialog, setShowCreateIntegrationDialog,
  showEditIntegrationDialog, setShowEditIntegrationDialog,
  selectedIntegration,
  showViewFrameworkDialog, setShowViewFrameworkDialog,
  selectedFramework,
  showViewAuditDialog, setShowViewAuditDialog,
  selectedAuditLog,
  formData, setFormData,
  rolePermissions, setRolePermissions,
  roles, tenants,
  fetchData,
}: AdminDialogsProps) {
  return (
    <>
      {/* View User Dialog */}
      <Dialog open={showViewUserDialog} onOpenChange={setShowViewUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Viewing user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-muted-foreground/20 rounded-full flex items-center justify-center text-lg font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-lg">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div><span className="text-sm text-muted-foreground">Role</span><p className="font-medium">{selectedUser.role}</p></div>
                <div><span className="text-sm text-muted-foreground">Status</span><p><Badge className={getStatusColor(selectedUser.status)}>{selectedUser.status}</Badge></p></div>
                <div><span className="text-sm text-muted-foreground">Tenant ID</span><p className="font-medium font-mono text-sm">{selectedUser.tenantId}</p></div>
                <div><span className="text-sm text-muted-foreground">Last Login</span><p className="font-medium">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Add a new user to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-user-name">Name</Label>
              <Input id="create-user-name" value={formData.name as string || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-user-email">Email</Label>
              <Input id="create-user-email" type="email" value={formData.email as string || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-user-password">Password</Label>
              <Input id="create-user-password" type="password" value={formData.password as string || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formData.roleId as string || ''} onValueChange={(val) => setFormData({ ...formData, roleId: val })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select value={formData.tenantId as string || ''} onValueChange={(val) => setFormData({ ...formData, tenantId: val })}>
                <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUserDialog(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const res = await fetch('/api/admin/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password, roleIds: formData.roleId ? [formData.roleId] : [], tenantId: formData.tenantId }),
                })
                if (res.ok) {
                  toast.success('User created successfully')
                  setShowCreateUserDialog(false)
                  fetchData()
                } else {
                  toast.error('Failed to create user')
                }
              } catch { toast.error('Failed to create user') }
            }}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Name</Label>
                <Input id="edit-user-name" value={formData.name as string || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-email">Email</Label>
                <Input id="edit-user-email" type="email" value={formData.email as string || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.roleId as string || ''} onValueChange={(val) => setFormData({ ...formData, roleId: val })}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const res = await fetch(`/api/users/${selectedUser?.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: formData.name, email: formData.email, roleIds: formData.roleId ? [formData.roleId] : [] }),
                })
                if (res.ok) {
                  toast.success('User updated successfully')
                  setShowEditUserDialog(false)
                  fetchData()
                } else {
                  toast.error('Failed to update user')
                }
              } catch { toast.error('Failed to update user') }
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={showCreateRoleDialog} onOpenChange={setShowCreateRoleDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>Define a new role with permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-role-name">Role Name</Label>
              <Input id="create-role-name" value={formData.name as string || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role-desc">Description</Label>
              <Textarea id="create-role-desc" value={formData.description as string || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {ALL_PERMISSIONS.map((perm) => (
                  <div key={perm} className="flex items-center space-x-2">
                    <Checkbox checked={rolePermissions.includes(perm)} onCheckedChange={(checked) => {
                      setRolePermissions(checked ? [...rolePermissions, perm] : rolePermissions.filter(p => p !== perm))
                    }} />
                    <label className="text-sm font-medium cursor-pointer" onClick={() => {
                      setRolePermissions(rolePermissions.includes(perm) ? rolePermissions.filter(p => p !== perm) : [...rolePermissions, perm])
                    }}>{perm}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRoleDialog(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const res = await fetch('/api/roles', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: formData.name, description: formData.description, permissions: rolePermissions }),
                })
                if (res.ok) {
                  toast.success('Role created successfully')
                  setShowCreateRoleDialog(false)
                  fetchData()
                } else {
                  toast.error('Failed to create role')
                }
              } catch { toast.error('Failed to create role') }
            }}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role permissions</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role-name">Role Name</Label>
                <Input id="edit-role-name" value={formData.name as string || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role-desc">Description</Label>
                <Textarea id="edit-role-desc" value={formData.description as string || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {ALL_PERMISSIONS.map((perm) => (
                    <div key={perm} className="flex items-center space-x-2">
                      <Checkbox checked={rolePermissions.includes(perm)} onCheckedChange={(checked) => {
                        setRolePermissions(checked ? [...rolePermissions, perm] : rolePermissions.filter(p => p !== perm))
                      }} />
                      <label className="text-sm font-medium cursor-pointer" onClick={() => {
                        setRolePermissions(rolePermissions.includes(perm) ? rolePermissions.filter(p => p !== perm) : [...rolePermissions, perm])
                      }}>{perm}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditRoleDialog(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const res = await fetch(`/api/roles/${selectedRole?.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: formData.name, description: formData.description, permissions: rolePermissions }),
                })
                if (res.ok) {
                  toast.success('Role updated successfully')
                  setShowEditRoleDialog(false)
                  fetchData()
                } else {
                  toast.error('Failed to update role')
                }
              } catch { toast.error('Failed to update role') }
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Alert Dialog */}
      <AlertDialog open={showDeleteRoleDialog} onOpenChange={setShowDeleteRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              try {
                const res = await fetch(`/api/roles/${selectedRole?.id}`, { method: 'DELETE' })
                if (res.ok) {
                  toast.success('Role deleted successfully')
                  setShowDeleteRoleDialog(false)
                  fetchData()
                } else {
                  toast.error('Failed to delete role')
                }
              } catch { toast.error('Failed to delete role') }
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Tenant Dialog */}
      <Dialog open={showCreateTenantDialog} onOpenChange={setShowCreateTenantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tenant</DialogTitle>
            <DialogDescription>Add a new tenant organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-tenant-name">Tenant Name</Label>
              <Input id="create-tenant-name" value={formData.name as string || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-tenant-org">Organization ID</Label>
              <Input id="create-tenant-org" value={formData.orgId as string || ''} onChange={(e) => setFormData({ ...formData, orgId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={formData.region as string || 'us-east'} onValueChange={(val) => setFormData({ ...formData, region: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east">US East</SelectItem>
                  <SelectItem value="us-west">US West</SelectItem>
                  <SelectItem value="eu-west">EU West</SelectItem>
                  <SelectItem value="eu-central">EU Central</SelectItem>
                  <SelectItem value="ap-southeast">Asia Pacific</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={formData.plan as string || 'standard'} onValueChange={(val) => setFormData({ ...formData, plan: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTenantDialog(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const res = await fetch('/api/tenants', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: formData.name, orgId: formData.orgId, region: formData.region, plan: formData.plan }),
                })
                if (res.ok) {
                  toast.success('Tenant created successfully')
                  setShowCreateTenantDialog(false)
                  fetchData()
                } else {
                  toast.error('Failed to create tenant')
                }
              } catch { toast.error('Failed to create tenant') }
            }}>Create Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Tenant Dialog */}
      <Dialog open={showViewTenantDialog} onOpenChange={setShowViewTenantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>Viewing tenant information</DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 mb-4">
                <h3 className="text-lg font-semibold">{selectedTenant.name}</h3>
                <Badge className={getPlanColor(selectedTenant.plan)}>{selectedTenant.plan}</Badge>
                <Badge className={getStatusColor(selectedTenant.status)}>{selectedTenant.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Tenant ID</span><p className="font-mono text-sm">{selectedTenant.id}</p></div>
                <div><span className="text-sm text-muted-foreground">Created</span><p className="font-medium">{formatDate(selectedTenant.createdAt)}</p></div>
                <div><span className="text-sm text-muted-foreground">Users</span><p className="font-medium">{selectedTenant.userCount}</p></div>
                <div><span className="text-sm text-muted-foreground">RFPs</span><p className="font-medium">{selectedTenant.rfpCount}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={showEditTenantDialog} onOpenChange={setShowEditTenantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>Update tenant information</DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tenant-name">Tenant Name</Label>
                <Input id="edit-tenant-name" value={formData.name as string || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={formData.plan as string || 'standard'} onValueChange={(val) => setFormData({ ...formData, plan: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTenantDialog(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const res = await fetch(`/api/tenants/${selectedTenant?.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: formData.name, plan: formData.plan }),
                })
                if (res.ok) {
                  toast.success('Tenant updated successfully')
                  setShowEditTenantDialog(false)
                  fetchData()
                } else {
                  toast.error('Failed to update tenant')
                }
              } catch { toast.error('Failed to update tenant') }
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Integration Dialog */}
      <Dialog open={showCreateIntegrationDialog} onOpenChange={setShowCreateIntegrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>Connect a new third-party service</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-int-name">Integration Name</Label>
              <Input id="create-int-name" value={formData.name as string || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type as string || 'erp'} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="erp">ERP</SelectItem>
                  <SelectItem value="crm">CRM</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-int-desc">Description</Label>
              <Textarea id="create-int-desc" value={formData.description as string || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-int-key">API Key</Label>
              <Input id="create-int-key" type="password" value={formData.apiKey as string || ''} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-int-url">Endpoint URL</Label>
              <Input id="create-int-url" value={formData.endpointUrl as string || ''} onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateIntegrationDialog(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const res = await fetch('/api/integrations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: formData.name, type: formData.type, description: formData.description, apiKey: formData.apiKey, endpointUrl: formData.endpointUrl }),
                })
                if (res.ok) {
                  toast.success('Integration added successfully')
                  setShowCreateIntegrationDialog(false)
                  fetchData()
                } else {
                  toast.error('Failed to add integration')
                }
              } catch { toast.error('Failed to add integration') }
            }}>Add Integration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Integration Dialog */}
      <Dialog open={showEditIntegrationDialog} onOpenChange={setShowEditIntegrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Integration</DialogTitle>
            <DialogDescription>Update integration settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-int-name">Integration Name</Label>
              <Input id="edit-int-name" value={formData.name as string || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type as string || 'api'} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="oauth">OAuth</SelectItem>
                  <SelectItem value="saml">SAML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-int-desc">Description</Label>
              <Textarea id="edit-int-desc" value={formData.description as string || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-int-key">API Key</Label>
              <Input id="edit-int-key" type="password" value={formData.apiKey as string || ''} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-int-url">Endpoint URL</Label>
              <Input id="edit-int-url" value={formData.endpointUrl as string || ''} onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditIntegrationDialog(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const res = await fetch(`/api/integrations/${selectedIntegration?.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: formData.name, type: formData.type, description: formData.description, apiKey: formData.apiKey, endpointUrl: formData.endpointUrl }),
                })
                if (res.ok) {
                  toast.success('Integration updated successfully')
                  setShowEditIntegrationDialog(false)
                  fetchData()
                } else {
                  toast.error('Failed to update integration')
                }
              } catch { toast.error('Failed to update integration') }
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Framework Dialog */}
      <Dialog open={showViewFrameworkDialog} onOpenChange={setShowViewFrameworkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Framework Details</DialogTitle>
            <DialogDescription>Compliance framework information</DialogDescription>
          </DialogHeader>
          {selectedFramework && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 mb-4">
                <h3 className="text-lg font-semibold">{selectedFramework.name}</h3>
                <Badge className={getStatusColor(selectedFramework.status)}>{selectedFramework.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{selectedFramework.description}</p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div><span className="text-sm text-muted-foreground">Version</span><p className="font-medium">{selectedFramework.version}</p></div>
                <div><span className="text-sm text-muted-foreground">Last Updated</span><p className="font-medium">{formatDate(selectedFramework.lastUpdated)}</p></div>
                <div><span className="text-sm text-muted-foreground">Controls</span><p className="font-medium">{selectedFramework.implementedControls} / {selectedFramework.controlsCount}</p></div>
                <div><span className="text-sm text-muted-foreground">Completion</span><p className="font-medium">{Math.round((selectedFramework.implementedControls / selectedFramework.controlsCount) * 100)}%</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Audit Log Dialog */}
      <Dialog open={showViewAuditDialog} onOpenChange={setShowViewAuditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Full audit log entry</DialogDescription>
          </DialogHeader>
          {selectedAuditLog && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Timestamp</span><p className="font-medium">{new Date(selectedAuditLog.timestamp).toLocaleString()}</p></div>
                <div><span className="text-sm text-muted-foreground">Action</span><p><Badge variant="outline">{selectedAuditLog.action}</Badge></p></div>
                <div><span className="text-sm text-muted-foreground">User</span><p className="font-medium">{selectedAuditLog.user}</p></div>
                <div><span className="text-sm text-muted-foreground">Target</span><p className="font-medium">{selectedAuditLog.target}</p></div>
                <div><span className="text-sm text-muted-foreground">IP Address</span><p className="font-medium font-mono">{selectedAuditLog.ip || 'N/A'}</p></div>
              </div>
              <div className="pt-2">
                <span className="text-sm text-muted-foreground">Details</span>
                <p className="font-medium mt-1 p-3 bg-muted rounded-md text-sm">{selectedAuditLog.details || 'No additional details'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}