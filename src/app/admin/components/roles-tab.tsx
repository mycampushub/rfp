"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { Role } from "../types"

export function RolesTab({ roles, onAddRole, onEditRole, onDeleteRole }: { roles: Role[], onAddRole: () => void, onEditRole: (_role: Role) => void, onDeleteRole: (_role: Role) => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>
              Define roles and their permissions
            </CardDescription>
          </div>
          <Button onClick={onAddRole}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{role.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {role.userCount} users assigned
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => onEditRole(role)} aria-label="Edit role">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDeleteRole(role)} aria-label="Delete role">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {role.permissions.map((permission) => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}