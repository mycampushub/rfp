import { NextRequest, NextResponse } from "next/server"
import { getServerSession, type Session } from "next-auth"
import { authOptions } from "./auth"
import { Permission, PERMISSIONS } from "@/types/auth"
import { db } from "./db"
import { AuthError, PermissionError, getTenantContext } from "./tenant-context"

export type { AuthError, PermissionError }
export { getTenantContext }

export type TenantContext = {
  tenantId: string
  userId: string
  userEmail: string
}

export async function withAuth(
  request: NextRequest,
  handler: (session: Session, ctx: TenantContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      userEmail: session.user.email ?? "",
    }
    return await handler(session, ctx)
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

export async function checkPermission(
  session: Session | null,
  permission: Permission
): Promise<boolean> {
  if (!session?.user) return false
  const roleIds = session.user.roleIds || []
  if (roleIds.length === 0) return false
  const roles = await db.role.findMany({ where: { id: { in: roleIds } } })
  const userPermissions = roles.flatMap(role => {
    const perms = role.permissions
    return Array.isArray(perms) ? perms.filter((p): p is string => typeof p === "string") : []
  })
  return userPermissions.includes(permission)
}

export async function requirePermission(session: Session | null, permission: Permission): Promise<void> {
  const has = await checkPermission(session, permission)
  if (!has) {
    throw new PermissionError(`Permission denied: ${permission}`)
  }
}
