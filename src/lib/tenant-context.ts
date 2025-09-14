import { headers } from "next/headers"

export interface TenantContext {
  tenantId: string
  userId: string
  userEmail: string
}

export function getTenantContext(): TenantContext {
  const headersList = headers()
  
  const tenantId = headersList.get("x-tenant-id")
  const userId = headersList.get("x-user-id")
  const userEmail = headersList.get("x-user-email")

  if (!tenantId || !userId || !userEmail) {
    throw new Error("Missing tenant context in headers")
  }

  return {
    tenantId,
    userId,
    userEmail,
  }
}

export function createTenantAwareQuery<T extends Record<string, any>>(
  baseQuery: T,
  tenantContext: TenantContext
): T {
  return {
    ...baseQuery,
    where: {
      ...baseQuery.where,
      tenantId: tenantContext.tenantId,
    },
  }
}