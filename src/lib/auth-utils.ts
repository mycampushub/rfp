import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { Permission, PERMISSIONS } from "@/types/auth"
import { db } from "./db"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // Get user's roles and permissions
  const roles = await db.role.findMany({
    where: {
      id: {
        in: user.roleIds || []
      }
    }
  })

  const userPermissions = roles.flatMap(role => 
    role.permissions || []
  )

  return userPermissions.includes(permission)
}

export async function requirePermission(permission: Permission) {
  const hasAccess = await hasPermission(permission)
  if (!hasAccess) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // Get user's roles and permissions
  const roles = await db.role.findMany({
    where: {
      id: {
        in: user.roleIds || []
      }
    }
  })

  const userPermissions = roles.flatMap(role => 
    role.permissions || []
  )

  return permissions.some(permission => userPermissions.includes(permission))
}

export async function requireAnyPermission(permissions: Permission[]) {
  const hasAccess = await hasAnyPermission(permissions)
  if (!hasAccess) {
    throw new Error(`Permission denied: none of the required permissions found`)
  }
}

export async function isSystemAdmin(): Promise<boolean> {
  return hasPermission(PERMISSIONS.SYSTEM_ADMIN)
}

export async function requireSystemAdmin() {
  const isAdmin = await isSystemAdmin()
  if (!isAdmin) {
    throw new Error("System admin access required")
  }
}

export async function isTenantAdmin(): Promise<boolean> {
  return hasPermission(PERMISSIONS.MANAGE_TENANT)
}

export async function requireTenantAdmin() {
  const isAdmin = await isTenantAdmin()
  if (!isAdmin) {
    throw new Error("Tenant admin access required")
  }
}

export async function getCurrentTenant() {
  const user = await getCurrentUser()
  if (!user) return null

  return db.tenant.findUnique({
    where: {
      id: user.tenantId
    }
  })
}

export async function requireTenant() {
  const tenant = await getCurrentTenant()
  if (!tenant) {
    throw new Error("Tenant not found")
  }
  return tenant
}