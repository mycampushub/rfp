import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import type { Session } from "next-auth"

export interface TenantContext {
  tenantId: string
  userId: string
  userEmail: string
}

export class AuthError extends Error {
  statusCode = 401
  constructor(message: string) { super(message) }
}

export class PermissionError extends Error {
  statusCode = 403
  constructor(message: string) { super(message) }
}

/**
 * Get tenant context from an existing session (preferred) or fetch session automatically.
 * All callers should pass the session if they already have it to avoid double lookups.
 */
export function getTenantContext(session?: Session | null): TenantContext {
  if (!session?.user?.id || !session.user.email || !session.user.tenantId) {
    throw new AuthError("Missing tenant context in session")
  }
  return {
    tenantId: session.user.tenantId as string,
    userId: session.user.id as string,
    userEmail: session.user.email as string,
  }
}

export async function getTenantContextAsync(): Promise<TenantContext> {
  const session = await getServerSession(authOptions)
  return getTenantContext(session)
}

export function createTenantAwareQuery<T extends Record<string, unknown>>(
  baseQuery: T,
  tenantContext: TenantContext
): T & { where: { tenantId: string } } {
  return {
    ...baseQuery,
    where: {
      ...(baseQuery.where as Record<string, unknown>),
      tenantId: tenantContext.tenantId,
    },
  }
}
