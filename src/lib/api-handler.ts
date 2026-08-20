import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { Permission } from "@/types/auth"
import { db } from "./db"
import { type TenantContext, AuthError, PermissionError } from "./tenant-context"

export type { AuthError, PermissionError, TenantContext }

type SessionUser = Record<string, unknown>

/**
 * Wrap a route handler with authentication + tenant context.
 * Returns proper 401/403/500 error responses.
 */
export async function withAuth(
  request: NextRequest,
  handler: (
    _session: { user?: SessionUser },
    _ctx: TenantContext
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = session.user as SessionUser
    const ctx = {
      tenantId: String(user.tenantId ?? ''),
      userId: String(user.id ?? ''),
      userEmail: String(user.email ?? ''),
    }
    return await handler(session as { user?: SessionUser }, ctx)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * Check if the current session user has a specific permission.
 */
export async function checkPermission(
  session: { user?: SessionUser },
  permission: Permission
): Promise<boolean> {
  if (!session?.user) return false
  const user = session.user
  const roleIds = (user.roleIds || []) as string[]
  if (roleIds.length === 0) return false
  const rolesRaw = await db.role.findMany({ where: { id: { in: roleIds } } })
  const roles = rolesRaw as any[]
  const userPermissions = roles.flatMap((role: any) => role.permissions || [])
  return userPermissions.includes(permission)
}

/**
 * Require a specific permission — throws PermissionError if missing.
 */
export async function requirePermission(session: { user?: SessionUser }, permission: Permission): Promise<void> {
  const has = await checkPermission(session, permission)
  if (!has) {
    throw new PermissionError(`Permission denied: ${permission}`)
  }
}