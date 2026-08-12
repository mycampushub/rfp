import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import type { TenantContext } from "@/lib/tenant-context"

interface RbacResult {
  session: Awaited<ReturnType<typeof getServerSession>>
  ctx: TenantContext
}

/**
 * Require a specific permission. Returns { session, ctx } if authorized.
 * Throws AuthError (401) if not authenticated, PermissionError (403) if lacking permission.
 */
export async function requirePermission(permission: string): Promise<RbacResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new AuthError("Unauthorized")
  }

  const ctx = getTenantContext(session)

  const user = await db.user.findUnique({
    where: { id: ctx.userId },
    select: { roleIds: true },
  })

  if (!user) {
    throw new PermissionError(`Permission denied: ${permission}`)
  }

  const roleIds = user.roleIds as string[] | null
  if (!roleIds || roleIds.length === 0) {
    throw new PermissionError(`Permission denied: ${permission}`)
  }

  const roles = await db.role.findMany({
    where: {
      id: { in: roleIds },
      tenantId: ctx.tenantId,
    },
    select: { permissions: true },
  })

  const hasPermission = roles.some((role) => {
    const perms = (role.permissions as string[]) ?? []
    return perms.includes(permission)
  })

  if (!hasPermission) {
    throw new PermissionError(`Permission denied: ${permission}`)
  }

  return { session, ctx }
}

/**
 * Require at least one of the listed permissions.
 * Throws AuthError (401) if not authenticated, PermissionError (403) if lacking all permissions.
 */
export async function requireAnyPermission(permissions: string[]): Promise<RbacResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new AuthError("Unauthorized")
  }

  const ctx = getTenantContext(session)

  const user = await db.user.findUnique({
    where: { id: ctx.userId },
    select: { roleIds: true },
  })

  if (!user) {
    throw new PermissionError(`Permission denied: one of [${permissions.join(", ")}]`)
  }

  const roleIds = user.roleIds as string[] | null
  if (!roleIds || roleIds.length === 0) {
    throw new PermissionError(`Permission denied: one of [${permissions.join(", ")}]`)
  }

  const roles = await db.role.findMany({
    where: {
      id: { in: roleIds },
      tenantId: ctx.tenantId,
    },
    select: { permissions: true },
  })

  const allPerms = new Set<string>()
  roles.forEach((role) => {
    const perms = (role.permissions as string[]) ?? []
    perms.forEach((p) => allPerms.add(p))
  })

  const hasAny = permissions.some((p) => allPerms.has(p))
  if (!hasAny) {
    throw new PermissionError(`Permission denied: one of [${permissions.join(", ")}]`)
  }

  return { session, ctx }
}
