import { db } from "@/lib/db"
import { TenantService } from "@/lib/tenant-service"
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto"

export interface SecurityConfig {
  encryptionKey: string
  dataRetention: {
    standard: number // years
    short: number // years
    deleted: number // days
  }
  complianceStandards: string[]
  auditLogRetention: number // days
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    expireDays: number
  }
  sessionPolicy: {
    timeoutMinutes: number
    maxConcurrentSessions: number
    requireMFA: boolean
  }
}

export interface AuditEvent {
  action: string
  resource: string
  resourceId?: string
  details?: any
  severity: "info" | "warning" | "error" | "critical"
  category: "authentication" | "authorization" | "data_access" | "data_modification" | "system" | "compliance"
}

export class SecurityService {
  private static readonly ALGORITHM = "aes-256-gcm"
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-secure-encryption-key-min-32-chars"

  static encryptData(data: string): { encrypted: string; iv: string; tag: string } {
    const iv = randomBytes(16)
    const cipher = createCipheriv(
      this.ALGORITHM,
      Buffer.from(this.ENCRYPTION_KEY.slice(0, 32)),
      iv
    )
    
    let encrypted = cipher.update(data, "utf8", "hex")
    encrypted += cipher.final("hex")
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
    }
  }

  static decryptData(encryptedData: string, iv: string, tag: string): string {
    const decipher = createDecipheriv(
      this.ALGORITHM,
      Buffer.from(this.ENCRYPTION_KEY.slice(0, 32)),
      Buffer.from(iv, "hex")
    )
    
    decipher.setAuthTag(Buffer.from(tag, "hex"))
    
    let decrypted = decipher.update(encryptedData, "hex", "utf8")
    decrypted += decipher.final("utf8")
    
    return decrypted
  }

  static hashPassword(password: string): string {
    return createHash("sha256").update(password).digest("hex")
  }

  static validatePassword(password: string, policy: SecurityConfig["passwordPolicy"]): boolean {
    if (password.length < policy.minLength) return false
    if (policy.requireUppercase && !/[A-Z]/.test(password)) return false
    if (policy.requireLowercase && !/[a-z]/.test(password)) return false
    if (policy.requireNumbers && !/\d/.test(password)) return false
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false
    return true
  }

  static generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString("hex")
  }

  static async logAuditEvent(
    tenantId: string,
    userId: string,
    event: AuditEvent,
    request?: NextRequest
  ): Promise<void> {
    try {
      const ipAddress = request?.headers.get("x-forwarded-for") || 
                      request?.headers.get("x-real-ip") || 
                      "unknown"
      
      const userAgent = request?.headers.get("user-agent") || "unknown"

      await db.auditLog.create({
        data: {
          tenantId,
          actor: userId,
          action: event.action,
          targetType: event.resource,
          targetId: event.resourceId,
          timestamp: new Date(),
          ip: ipAddress,
          metadata: {
            severity: event.severity,
            category: event.category,
            details: event.details,
            userAgent,
          },
        },
      })

      // Check for security alerts
      await this.checkSecurityAlerts(tenantId, event)
    } catch (error) {
      console.error("Failed to log audit event:", error)
    }
  }

  private static async checkSecurityAlerts(tenantId: string, event: AuditEvent): Promise<void> {
    // Implement security alert detection logic
    const alerts = []

    // Failed login attempts
    if (event.category === "authentication" && event.action === "login_failed") {
      const recentFailures = await db.auditLog.count({
        where: {
          tenantId,
          action: "login_failed",
          timestamp: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
          },
        },
      })

      if (recentFailures >= 5) {
        alerts.push({
          type: "brute_force",
          message: "Multiple failed login attempts detected",
          severity: "high",
        })
      }
    }

    // Unauthorized access attempts
    if (event.category === "authorization" && event.severity === "error") {
      const recentUnauthorized = await db.auditLog.count({
        where: {
          tenantId,
          category: "authorization",
          metadata: {
            path: { contains: "/api/" },
          },
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      })

      if (recentUnauthorized >= 10) {
        alerts.push({
          type: "unauthorized_access",
          message: "Multiple unauthorized access attempts detected",
          severity: "high",
        })
      }
    }

    // Data access anomalies
    if (event.category === "data_access" && event.resourceId) {
      const recentAccess = await db.auditLog.findMany({
        where: {
          tenantId,
          targetType: event.resource,
          targetId: event.resourceId,
          timestamp: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        orderBy: { timestamp: "desc" },
      })

      if (recentAccess.length > 100) {
        alerts.push({
          type: "excessive_access",
          message: "Excessive access to resource detected",
          severity: "medium",
        })
      }
    }

    // Store alerts
    for (const alert of alerts) {
      await db.securityAlert.create({
        data: {
          tenantId,
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
          status: "active",
          metadata: {
            triggerEvent: event,
          },
        },
      })
    }
  }

  static async getSecurityAlerts(tenantId: string, options?: {
    status?: "active" | "resolved" | "dismissed"
    severity?: "low" | "medium" | "high" | "critical"
    limit?: number
    offset?: number
  }) {
    const where: any = { tenantId }
    
    if (options?.status) where.status = options.status
    if (options?.severity) where.severity = options.severity

    const [alerts, total] = await Promise.all([
      db.securityAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      db.securityAlert.count({ where }),
    ])

    return { alerts, total }
  }

  static async resolveSecurityAlert(alertId: string, tenantId: string, resolution: string) {
    return await db.securityAlert.update({
      where: { id: alertId, tenantId },
      data: {
        status: "resolved",
        resolution,
        resolvedAt: new Date(),
      },
    })
  }

  static async getComplianceReport(tenantId: string): Promise<any> {
    const [
      totalEvents,
      securityEvents,
      complianceEvents,
      recentAlerts,
      dataRetentionStats,
    ] = await Promise.all([
      db.auditLog.count({ where: { tenantId } }),
      db.auditLog.count({
        where: {
          tenantId,
          OR: [
            { metadata: { path: ["severity"], equals: "error" } },
            { metadata: { path: ["severity"], equals: "critical" } },
          ],
        },
      }),
      db.auditLog.count({
        where: {
          tenantId,
          metadata: { path: ["category"], equals: "compliance" },
        },
      }),
      db.securityAlert.count({
        where: {
          tenantId,
          status: "active",
        },
      }),
      this.getDataRetentionStats(tenantId),
    ])

    return {
      auditSummary: {
        totalEvents,
        securityEvents,
        complianceEvents,
      },
      alerts: {
        active: recentAlerts,
      },
      dataRetention: dataRetentionStats,
      generatedAt: new Date().toISOString(),
    }
  }

  private static async getDataRetentionStats(tenantId: string) {
    const now = new Date()
    
    const [
      totalFiles,
      filesUnderRetention,
      expiredFiles,
      totalLogs,
      logsUnderRetention,
    ] = await Promise.all([
      db.file.count({ where: { tenantId } }),
      db.file.count({
        where: {
          tenantId,
          retention: { not: "deleted" },
        },
      }),
      db.file.count({
        where: {
          tenantId,
          OR: [
            {
              retention: "standard",
              createdAt: {
                lt: new Date(now.getFullYear() - 7, now.getMonth(), now.getDate()),
              },
            },
            {
              retention: "short",
              createdAt: {
                lt: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
              },
            },
          ],
        },
      }),
      db.auditLog.count({ where: { tenantId } }),
      db.auditLog.count({
        where: {
          tenantId,
          timestamp: {
            gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year
          },
        },
      }),
    ])

    return {
      files: {
        total: totalFiles,
        underRetention: filesUnderRetention,
        expired: expiredFiles,
      },
      logs: {
        total: totalLogs,
        underRetention: logsUnderRetention,
      },
    }
  }

  static async getTenantSecurityConfig(tenantId: string): Promise<SecurityConfig> {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      throw new Error("Tenant not found")
    }

    return {
      encryptionKey: this.ENCRYPTION_KEY,
      dataRetention: {
        standard: 7,
        short: 1,
        deleted: 30,
      },
      complianceStandards: ["SOC2", "ISO27001", "GDPR"],
      auditLogRetention: 365,
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expireDays: 90,
      },
      sessionPolicy: {
        timeoutMinutes: 30,
        maxConcurrentSessions: 3,
        requireMFA: true,
      },
      ...tenant.settings?.security,
    }
  }

  static async updateTenantSecurityConfig(
    tenantId: string,
    config: Partial<SecurityConfig>
  ): Promise<void> {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      throw new Error("Tenant not found")
    }

    await db.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...tenant.settings,
          security: {
            ...tenant.settings?.security,
            ...config,
          },
        },
      },
    })

    // Log configuration change
    await this.logAuditEvent(tenantId, "system", {
      action: "security_config_updated",
      resource: "tenant_security",
      severity: "info",
      category: "compliance",
      details: { updatedFields: Object.keys(config) },
    })
  }

  static async runSecurityScan(tenantId: string): Promise<any> {
    const scanResults = {
      vulnerabilities: [] as any[],
      recommendations: [] as string[],
      score: 100, // Start with perfect score
    }

    // Check for weak passwords
    const usersWithWeakPasswords = await db.user.count({
      where: {
        tenantId,
        // This would need to be implemented based on your password storage
      },
    })

    if (usersWithWeakPasswords > 0) {
      scanResults.vulnerabilities.push({
        type: "weak_passwords",
        severity: "high",
        count: usersWithWeakPasswords,
      })
      scanResults.score -= 20
      scanResults.recommendations.push("Enforce stronger password policies")
    }

    // Check for inactive users
    const inactiveUsers = await db.user.count({
      where: {
        tenantId,
        isActive: true,
        // Last login more than 90 days ago
        // This would need last login tracking
      },
    })

    if (inactiveUsers > 0) {
      scanResults.vulnerabilities.push({
        type: "inactive_users",
        severity: "medium",
        count: inactiveUsers,
      })
      scanResults.score -= 10
      scanResults.recommendations.push("Review and deactivate inactive user accounts")
    }

    // Check for recent security events
    const recentSecurityEvents = await db.auditLog.count({
      where: {
        tenantId,
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
        OR: [
          { metadata: { path: ["severity"], equals: "error" } },
          { metadata: { path: ["severity"], equals: "critical" } },
        ],
      },
    })

    if (recentSecurityEvents > 10) {
      scanResults.vulnerabilities.push({
        type: "recent_security_events",
        severity: "medium",
        count: recentSecurityEvents,
      })
      scanResults.score -= 15
      scanResults.recommendations.push("Investigate recent security events")
    }

    // Ensure score doesn't go below 0
    scanResults.score = Math.max(0, scanResults.score)

    return scanResults
  }
}