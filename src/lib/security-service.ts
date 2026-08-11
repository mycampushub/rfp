import { db } from "@/lib/db"
import { AuditLogger } from "@/lib/audit-logger"
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
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!

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

  /**
   * Log a security audit event via the canonical AuditLogger.
   * Delegates the DB write to AuditLogger.log() and then checks for alerts.
   */
  static async logAuditEvent(
    tenantId: string,
    userId: string,
    event: AuditEvent,
    _request?: NextRequest
  ): Promise<void> {
    try {
      await AuditLogger.log({
        action: event.action,
        targetType: event.resource,
        targetId: event.resourceId || "",
        userId,
        tenantId,
        metadata: {
          severity: event.severity,
          category: event.category,
          details: event.details,
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
      const recentFailures = await db.activityLog.count({
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
      const recentUnauthorized = await db.activityLog.count({
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
      const recentAccess = await db.activityLog.findMany({
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
      db.activityLog.count({ where: { tenantId } }),
      db.activityLog.count({
        where: {
          tenantId,
          OR: [
            { metadata: { path: ["severity"], equals: "error" } },
            { metadata: { path: ["severity"], equals: "critical" } },
          ],
        },
      }),
      db.activityLog.count({
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
      db.activityLog.count({ where: { tenantId } }),
      db.activityLog.count({
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
    const findings: Array<{
      type: string
      severity: "low" | "medium" | "high" | "critical"
      description: string
      category: "infrastructure" | "tenant"
    }> = []
    const recommendations: string[] = []
    let score = 100

    // --- Infrastructure-level checks (not tenant-specific) ---

    // 1. Check ENCRYPTION_KEY
    const encryptionKey = process.env.ENCRYPTION_KEY
    const knownWeakKeys = ["changeme", "default-encryption-key", "secret", "", undefined]
    if (!encryptionKey || encryptionKey.length < 32 || knownWeakKeys.includes(encryptionKey.toLowerCase())) {
      const detail = !encryptionKey
        ? "ENCRYPTION_KEY is not set in environment variables"
        : encryptionKey.length < 32
          ? `ENCRYPTION_KEY is only ${encryptionKey.length} characters (minimum 32 required for AES-256)`
          : "ENCRYPTION_KEY appears to be a default/weak value"
      findings.push({
        type: "weak_encryption_key",
        severity: "critical",
        description: detail,
        category: "infrastructure",
      })
      score -= 35
      recommendations.push("Set a strong ENCRYPTION_KEY (at least 32 random characters) in your .env file")
    }

    // 2. Check NEXTAUTH_SECRET (session secret)
    const sessionSecret = process.env.NEXTAUTH_SECRET
    const knownWeakSecrets = [
      "dev-secret-key-change-in-production",
      "changeme",
      "secret",
      "default-secret",
    ]
    if (!sessionSecret) {
      findings.push({
        type: "missing_session_secret",
        severity: "critical",
        description: "NEXTAUTH_SECRET is not set; sessions are not cryptographically secured",
        category: "infrastructure",
      })
      score -= 35
      recommendations.push("Set a strong NEXTAUTH_SECRET (at least 32 characters) in your .env file")
    } else if (sessionSecret.length < 32) {
      findings.push({
        type: "short_session_secret",
        severity: "high",
        description: `NEXTAUTH_SECRET is only ${sessionSecret.length} characters; recommended minimum is 32`,
        category: "infrastructure",
      })
      score -= 15
      recommendations.push("Increase NEXTAUTH_SECRET length to at least 32 characters")
    } else if (knownWeakSecrets.includes(sessionSecret)) {
      findings.push({
        type: "default_session_secret",
        severity: "critical",
        description: "NEXTAUTH_SECRET matches a known default value; sessions can be forged",
        category: "infrastructure",
      })
      score -= 35
      recommendations.push("Replace NEXTAUTH_SECRET with a cryptographically random value")
    }

    // --- Tenant-level checks ---

    // 3. Check for users with MFA disabled
    const [totalUsers, usersWithoutMFA] = await Promise.all([
      db.user.count({ where: { tenantId, isActive: true } }),
      db.user.count({ where: { tenantId, isActive: true, mfaEnabled: false } }),
    ])

    if (totalUsers > 0 && usersWithoutMFA === totalUsers) {
      findings.push({
        type: "no_mfa_users",
        severity: "medium",
        description: `None of the ${totalUsers} active user(s) have MFA enabled`,
        category: "tenant",
      })
      score -= 10
      recommendations.push("Enable MFA for at least admin accounts to protect against credential compromise")
    } else if (usersWithoutMFA > 0) {
      findings.push({
        type: "partial_mfa_adoption",
        severity: "low",
        description: `${usersWithoutMFA} of ${totalUsers} active user(s) do not have MFA enabled`,
        category: "tenant",
      })
      score -= 5
      recommendations.push(`Enable MFA for the remaining ${usersWithoutMFA} user(s) without it`)
    }

    // 4. Check for active unresolved security alerts
    const activeAlerts = await db.securityAlert.count({
      where: { tenantId, status: "active" },
    })

    if (activeAlerts > 0) {
      findings.push({
        type: "unresolved_security_alerts",
        severity: activeAlerts > 5 ? "high" : "medium",
        description: `${activeAlerts} unresolved security alert(s) require attention`,
        category: "tenant",
      })
      score -= activeAlerts > 5 ? 15 : 8
      recommendations.push("Review and resolve open security alerts in the admin dashboard")
    }

    // 5. Check for recent high-severity audit events (last 7 days)
    const recentSecurityEvents = await db.activityLog.count({
      where: {
        tenantId,
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        OR: [
          { action: "login_failed" },
          { metadata: { path: ["severity"], equals: "error" } },
          { metadata: { path: ["severity"], equals: "critical" } },
        ],
      },
    })

    if (recentSecurityEvents > 10) {
      findings.push({
        type: "recent_security_events",
        severity: "medium",
        description: `${recentSecurityEvents} high-severity audit event(s) in the last 7 days`,
        category: "tenant",
      })
      score -= 10
      recommendations.push("Investigate recent high-severity audit events for potential threats")
    }

    // Clamp score to 0–100
    score = Math.max(0, Math.min(100, score))

    return {
      score,
      findings,
      recommendations,
      scannedAt: new Date().toISOString(),
    }
  }
}