import { headers } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { Prisma } from "@prisma/client"
import { getTenantContextAsync } from "@/lib/tenant-context"

export interface AuditLogData {
  action: string
  targetType: string
  targetId: string
  metadata?: Record<string, unknown>
  userId?: string
  tenantId?: string
  ipAddress?: string
  userAgent?: string
}

export class AuditLogger {
  static async log(data: AuditLogData): Promise<void> {
    try {
      let tenantId = data.tenantId
      let userId = data.userId

      if (!tenantId || !userId) {
        try {
          const tenantContext = await getTenantContextAsync()
          tenantId = tenantContext.tenantId
          userId = tenantContext.userId
        } catch {
          const session = await getServerSession(authOptions)
          if (session?.user) {
            tenantId = session.user.tenantId as string
            userId = session.user.id as string
          }
        }
      }

      const headersList = await headers()
      const ipAddress = this.getClientIP(headersList)
      const userAgent = headersList.get("user-agent") || undefined

      await db.activityLog.create({
        data: {
          tenantId: tenantId || "system",
          actor: userId || "system",
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          metadata: (data.metadata || {}) as unknown as Prisma.InputJsonValue,
          ip: ipAddress,
        },
      })
    } catch (error) {
      console.error("Error logging audit event:", error)
    }
  }

  static async logRFPAction(
    action: string,
    rfpId: string,
    metadata?: Record<string, unknown>,
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
    metadata?: Record<string, unknown>,
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
    metadata?: Record<string, unknown>,
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
    metadata?: Record<string, unknown>,
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
    metadata?: Record<string, unknown>
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
    metadata?: Record<string, unknown>
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
    metadata?: Record<string, unknown>
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
    metadata?: Record<string, unknown>
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
    const whereClause: Prisma.ActivityLogWhereInput = { tenantId }

    if (filters) {
      if (filters.userId) whereClause.actor = filters.userId
      if (filters.targetType) whereClause.targetType = filters.targetType
      if (filters.action) whereClause.action = filters.action
      if (filters.targetId) whereClause.targetId = filters.targetId
      if (filters.startDate || filters.endDate) {
        const timestamp: Prisma.DateTimeFilter<"ActivityLog"> = {}
        if (filters.startDate) timestamp.gte = filters.startDate
        if (filters.endDate) timestamp.lte = filters.endDate
        whereClause.timestamp = timestamp
      }
    }

    const orderBy = options?.orderBy === "asc" ? { timestamp: "asc" as const } : { timestamp: "desc" as const }
    const take = Math.min(options?.limit || 100, 1000)
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
    const forwarded = headersList.get("x-forwarded-for")
    const realIP = headersList.get("x-real-ip")
    const cfConnectingIP = headersList.get("cf-connecting-ip")

    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) {
      return forwarded.split(",")[0].trim()
    }

    return "unknown"
  }
}

export const AUDIT_EVENTS = {
  RFP_CREATED: "rfp_created",
  RFP_UPDATED: "rfp_updated",
  RFP_DELETED: "rfp_deleted",
  RFP_PUBLISHED: "rfp_published",
  RFP_CLOSED: "rfp_closed",
  RFP_AWARDED: "rfp_awarded",
  VENDOR_CREATED: "vendor_created",
  VENDOR_UPDATED: "vendor_updated",
  VENDOR_DELETED: "vendor_deleted",
  VENDOR_INVITED: "vendor_invited",
  VENDOR_SUBMITTED: "vendor_submitted",
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  USER_ROLE_CHANGED: "user_role_changed",
  USER_PERMISSION_CHANGED: "user_permission_changed",
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
  PASSWORD_CHANGED: "password_changed",
  MFA_ENABLED: "mfa_enabled",
  MFA_DISABLED: "mfa_disabled",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  DATA_EXPORTED: "data_exported",
  DATA_IMPORTED: "data_imported",
  DATA_ACCESSED: "data_accessed",
  DATA_MODIFIED: "data_modified",
  DATA_DELETED: "data_deleted",
  SYSTEM_CONFIG_CHANGED: "system_config_changed",
  BACKUP_CREATED: "backup_created",
  BACKUP_RESTORED: "backup_restored",
  ERROR_OCCURRED: "error_occurred",
} as const
