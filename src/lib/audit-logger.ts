import { headers } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Request } from "express"

export interface AuditLogData {
  action: string
  targetType: string
  targetId: string
  metadata?: any
  userId?: string
  tenantId?: string
  ipAddress?: string
  userAgent?: string
}

export class AuditLogger {
  static async log(data: AuditLogData): Promise<void> {
    try {
      // Get tenant context if available
      let tenantId = data.tenantId
      let userId = data.userId

      if (!tenantId || !userId) {
        try {
          const tenantContext = getTenantContext()
          tenantId = tenantContext.tenantId
          userId = tenantContext.userId
        } catch {
          // Not in API context, try to get from session
          const session = await getServerSession(authOptions)
          if (session?.user) {
            tenantId = session.user.tenantId
            userId = session.user.id
          }
        }
      }

      // Get IP address and user agent from headers
      const headersList = headers()
      const ipAddress = this.getClientIP(headersList)
      const userAgent = headersList.get("user-agent") || undefined

      await db.activityLog.create({
        data: {
          tenantId: tenantId || "system",
          actor: userId || "system",
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          metadata: data.metadata,
          ip: ipAddress,
        },
      })
    } catch (error) {
      console.error("Error logging audit event:", error)
      // Don't throw error to avoid disrupting the main operation
    }
  }

  static async logRFPAction(
    action: string,
    rfpId: string,
    metadata?: any,
    userId?: string,
    tenantId?: string
  ): Promise<void> {
    await this.log({
      action,
      targetType: "RFP",
      targetId: rfpId,
      metadata,
      userId,
      tenantId,
    })
  }

  static async logVendorAction(
    action: string,
    vendorId: string,
    metadata?: any,
    userId?: string,
    tenantId?: string
  ): Promise<void> {
    await this.log({
      action,
      targetType: "Vendor",
      targetId: vendorId,
      metadata,
      userId,
      tenantId,
    })
  }

  static async logUserAction(
    action: string,
    targetUserId: string,
    metadata?: any,
    userId?: string,
    tenantId?: string
  ): Promise<void> {
    await this.log({
      action,
      targetType: "User",
      targetId: targetUserId,
      metadata,
      userId,
      tenantId,
    })
  }

  static async logSecurityEvent(
    action: string,
    targetId: string,
    metadata?: any,
    userId?: string,
    tenantId?: string
  ): Promise<void> {
    await this.log({
      action,
      targetType: "Security",
      targetId,
      metadata,
      userId,
      tenantId,
    })
  }

  static async logSystemEvent(
    action: string,
    targetId: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      action,
      targetType: "System",
      targetId,
      metadata,
      userId: "system",
      tenantId: "system",
    })
  }

  static async logAuthenticationEvent(
    action: "login" | "logout" | "login_failed" | "mfa_enabled" | "mfa_disabled",
    userId?: string,
    tenantId?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      action: `auth_${action}`,
      targetType: "Authentication",
      targetId: userId || "unknown",
      metadata,
      userId,
      tenantId,
    })
  }

  static async logDataAccess(
    action: string,
    targetType: string,
    targetId: string,
    userId?: string,
    tenantId?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      action: `data_${action}`,
      targetType,
      targetId,
      metadata: {
        ...metadata,
        access_type: "read",
      },
      userId,
      tenantId,
    })
  }

  static async logDataModification(
    action: string,
    targetType: string,
    targetId: string,
    userId?: string,
    tenantId?: string,
    metadata?: any
  ): Promise<void> {
    await this.log({
      action: `data_${action}`,
      targetType,
      targetId,
      metadata: {
        ...metadata,
        access_type: "write",
      },
      userId,
      tenantId,
    })
  }

  static async getAuditLogs(
    tenantId: string,
    filters?: {
      userId?: string
      targetType?: string
      action?: string
      targetId?: string
      startDate?: Date
      endDate?: Date
    },
    options?: {
      limit?: number
      offset?: number
      orderBy?: "asc" | "desc"
    }
  ) {
    const whereClause: any = { tenantId }

    if (filters) {
      if (filters.userId) whereClause.actor = filters.userId
      if (filters.targetType) whereClause.targetType = filters.targetType
      if (filters.action) whereClause.action = filters.action
      if (filters.targetId) whereClause.targetId = filters.targetId
      if (filters.startDate || filters.endDate) {
        whereClause.timestamp = {}
        if (filters.startDate) whereClause.timestamp.gte = filters.startDate
        if (filters.endDate) whereClause.timestamp.lte = filters.endDate
      }
    }

    const orderBy = options?.orderBy === "asc" ? { timestamp: "asc" } : { timestamp: "desc" }
    const take = options?.limit || 100
    const skip = options?.offset || 0

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where: whereClause,
        orderBy,
        take,
        skip,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.activityLog.count({ where: whereClause }),
    ])

    return { logs, total }
  }

  private static getClientIP(headersList: Headers): string {
    // Check for common proxy headers
    const forwarded = headersList.get("x-forwarded-for")
    const realIP = headersList.get("x-real-ip")
    const cfConnectingIP = headersList.get("cf-connecting-ip")

    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return forwarded.split(",")[0].trim()
    }

    // Fallback to remote address (not available in headers, would need request object)
    return "unknown"
  }
}

// Common audit event types
export const AUDIT_EVENTS = {
  // RFP Events
  RFP_CREATED: "rfp_created",
  RFP_UPDATED: "rfp_updated",
  RFP_DELETED: "rfp_deleted",
  RFP_PUBLISHED: "rfp_published",
  RFP_CLOSED: "rfp_closed",
  RFP_AWARDED: "rfp_awarded",

  // Vendor Events
  VENDOR_CREATED: "vendor_created",
  VENDOR_UPDATED: "vendor_updated",
  VENDOR_DELETED: "vendor_deleted",
  VENDOR_INVITED: "vendor_invited",
  VENDOR_SUBMITTED: "vendor_submitted",

  // User Events
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  USER_ROLE_CHANGED: "user_role_changed",
  USER_PERMISSION_CHANGED: "user_permission_changed",

  // Security Events
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
  PASSWORD_CHANGED: "password_changed",
  MFA_ENABLED: "mfa_enabled",
  MFA_DISABLED: "mfa_disabled",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",

  // Data Events
  DATA_EXPORTED: "data_exported",
  DATA_IMPORTED: "data_imported",
  DATA_ACCESSED: "data_accessed",
  DATA_MODIFIED: "data_modified",
  DATA_DELETED: "data_deleted",

  // System Events
  SYSTEM_CONFIG_CHANGED: "system_config_changed",
  BACKUP_CREATED: "backup_created",
  BACKUP_RESTORED: "backup_restored",
  ERROR_OCCURRED: "error_occurred",
} as const