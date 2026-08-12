/**
 * Backward-compatibility shim — all permission logic lives in @/lib/permissions.ts
 * (PermissionsManager class) which is the canonical implementation.
 *
 * Auth helper functions (getCurrentUser, requireAuth, getCurrentTenant,
 * requireTenant) are kept here because they are session/tenant context
 * helpers, not permission checks.
 */

import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { PermissionsManager } from "./permissions"
import { AuthError, PermissionError } from "./tenant-context"

// ─── Auth helpers (kept here — not permission logic) ───────────────────

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

export async function getCurrentTenant() {
  const user = await getCurrentUser()
  if (!user) return null

  // Inline DB call kept to avoid circular dependency with permissions.ts
  const { db } = await import("./db")
  return db.tenant.findUnique({
    where: {
      id: user.tenantId
    }
  })
}

export async function requireTenant() {
  const tenant = await getCurrentTenant()
  if (!tenant) {
    throw new AuthError("Tenant not found")
  }
  return tenant
}

// ─── Permission re-exports — delegate to PermissionsManager ─────────────

export async function hasPermission(permission: Parameters<typeof PermissionsManager.hasPermission>[0]) {
  return PermissionsManager.hasPermission(permission)
}

export async function requirePermission(permission: Parameters<typeof PermissionsManager.requirePermission>[0]) {
  return PermissionsManager.requirePermission(permission)
}

export async function hasAnyPermission(permissions: Parameters<typeof PermissionsManager.hasPermission>[0]) {
  return PermissionsManager.hasPermission(permissions)
}

export async function requireAnyPermission(permissions: Parameters<typeof PermissionsManager.requirePermission>[0]) {
  return PermissionsManager.requirePermission(permissions)
}

export async function isSystemAdmin(): Promise<boolean> {
  return PermissionsManager.isSystemAdmin()
}

export async function requireSystemAdmin() {
  const isAdmin = await PermissionsManager.isSystemAdmin()
  if (!isAdmin) {
    throw new PermissionError("System admin access required")
  }
}

export async function isTenantAdmin(): Promise<boolean> {
  return PermissionsManager.isTenantAdmin()
}

export async function requireTenantAdmin() {
  const isAdmin = await PermissionsManager.isTenantAdmin()
  if (!isAdmin) {
    throw new PermissionError("Tenant admin access required")
  }
}
