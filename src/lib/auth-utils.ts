import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { Permission, PERMISSIONS } from "@/types/auth"
import { db } from "./db"
import { AuthError, PermissionError } from "./tenant-context"

function parseRoleIds(roleIds: unknown): string[] {
  if (Array.isArray(roleIds)) {
    return roleIds.filter((id): id is string => typeof id === "string")
  }
  return []
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthError("Authentication required")
  }
  return user
}

export async function getUserPermissions(user: { roleIds?: string[] }): Promise<string[]> {
  const roles = await db.role.findMany({
    where: { id: { in: user.roleIds || [] } }
  })
  return roles.flatMap(role => {
    const perms = role.permissions
    return Array.isArray(perms) ? perms.filter((p): p is string => typeof p === "string") : []
  })
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  const userPermissions = await getUserPermissions(user)
  return userPermissions.includes(permission)
}

export async function requirePermission(permission: Permission) {
  const hasAccess = await hasPermission(permission)
  if (!hasAccess) {
    throw new PermissionError(`Permission denied: ${permission}`)
  }
}

export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  const userPermissions = await getUserPermissions(user)
  return permissions.some(permission => userPermissions.includes(permission))
}

export async function requireAnyPermission(permissions: Permission[]) {
  const hasAccess = await hasAnyPermission(permissions)
  if (!hasAccess) {
    throw new PermissionError("Permission denied: none of the required permissions found")
  }
}

export async function isSystemAdmin(): Promise<boolean> {
  return hasPermission(PERMISSIONS.SYSTEM_ADMIN)
}

export async function requireSystemAdmin() {
  const isAdmin = await isSystemAdmin()
  if (!isAdmin) {
    throw new PermissionError("System admin access required")
  }
}

export async function isTenantAdmin(): Promise<boolean> {
  return hasPermission(PERMISSIONS.MANAGE_TENANT)
}

export async function requireTenantAdmin() {
  const isAdmin = await isTenantAdmin()
  if (!isAdmin) {
    throw new PermissionError("Tenant admin access required")
  }
}

export async function getCurrentTenant() {
  const user = await getCurrentUser()
  if (!user) return null

  return db.tenant.findUnique({
    where: { id: user.tenantId }
  })
}

export async function requireTenant() {
  const tenant = await getCurrentTenant()
  if (!tenant) {
    throw new AuthError("Tenant not found")
  }
  return tenant
}

export { parseRoleIds }
