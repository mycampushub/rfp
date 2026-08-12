import { db } from "@/lib/db"
import { AuditLogger } from "@/lib/audit-logger"
import { DEFAULT_ROLES } from "@/types/auth"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export class TenantService {
  static async createTenant(data: {
    name: string
    region?: string
    plan?: string
    adminEmail: string
    adminName: string
    adminPassword?: string
  }) {
    const tenant = await db.tenant.create({
      data: {
        name: data.name,
        region: data.region,
        plan: data.plan || "standard",
        settings: {
          timezone: "UTC",
          language: "en",
          currency: "USD",
        },
        branding: {
          logo: null,
          colors: {
            primary: "#3B82F6",
            secondary: "#6B7280",
          },
        },
      },
    })

    // Create default roles for the tenant
    const roles = await Promise.all(
      Object.entries(DEFAULT_ROLES).map(([key, roleData]) =>
        db.role.create({
          data: {
            tenantId: tenant.id,
            name: roleData.name,
            permissions: roleData.permissions,
          },
        })
      )
    )

    // Create admin user with hashed password
    const rawPassword = data.adminPassword || crypto.randomBytes(16).toString("hex")
    const hashedPassword = await bcrypt.hash(rawPassword, 12)
    const adminUser = await db.user.create({
      data: {
        tenantId: tenant.id,
        email: data.adminEmail,
        name: data.adminName,
        password: hashedPassword,
        roleIds: [roles.find(r => r.name === "Tenant Admin")!.id],
        isActive: true,
      },
    })

    return {
      tenant,
      adminUser,
      roles,
    }
  }

  static async getTenantById(tenantId: string) {
    return await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    })
  }

  static async updateTenantSettings(tenantId: string, newSettings: any) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })
    return await db.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...(tenant?.settings && typeof tenant.settings === "object" ? tenant.settings : {}),
          ...newSettings,
        },
      },
    })
  }

  static async updateTenantBranding(tenantId: string, newBranding: any) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { branding: true },
    })
    return await db.tenant.update({
      where: { id: tenantId },
      data: {
        branding: {
          ...(tenant?.branding && typeof tenant.branding === "object" ? tenant.branding : {}),
          ...newBranding,
        },
      },
    })
  }

  static async getTenantStats(tenantId: string) {
    const [
      totalRfps,
      activeRfps,
      totalVendors,
      activeVendors,
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      db.rFP.count({ where: { tenantId } }),
      db.rFP.count({ where: { tenantId, status: "published" } }),
      db.vendor.count({ where: { tenantId } }),
      db.vendor.count({ where: { tenantId, isActive: true } }),
      db.user.count({ where: { tenantId } }),
      db.user.count({ where: { tenantId, isActive: true } }),
    ])

    return {
      totalRfps,
      activeRfps,
      totalVendors,
      activeVendors,
      totalUsers,
      activeUsers,
    }
  }

  static async validateTenantAccess(tenantId: string, userId: string) {
    const user = await db.user.findFirst({
      where: {
        id: userId,
        tenantId,
        isActive: true,
      },
    })

    return !!user
  }

  static async getUserPermissions(userId: string, tenantId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
      },
    })

    if (!user || user.tenantId !== tenantId) {
      return []
    }

    const roles = await db.role.findMany({
      where: {
        id: {
          in: (user.roleIds || []) as string[],
        },
        tenantId,
      },
    })

    return roles.flatMap(role => role.permissions || [])
  }

  static async hasPermission(userId: string, tenantId: string, permission: string) {
    const userPermissions = await this.getUserPermissions(userId, tenantId)
    return userPermissions.includes(permission)
  }

  /**
   * @deprecated Use AuditLogger.log() directly instead.
   */
  static async createAuditLog(
    tenantId: string,
    actor: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata?: any,
    _ip?: string
  ) {
    return AuditLogger.log({
      action,
      targetType,
      targetId,
      metadata,
      userId: actor,
      tenantId,
    })
  }

  /**
   * @deprecated Use AuditLogger.getAuditLogs() directly instead.
   */
  static async getAuditLogs(tenantId: string, options?: {
    limit?: number
    offset?: number
    actor?: string
    targetType?: string
    startDate?: Date
    endDate?: Date
  }) {
    return AuditLogger.getAuditLogs(tenantId, {
      userId: options?.actor,
      targetType: options?.targetType,
      startDate: options?.startDate,
      endDate: options?.endDate,
    }, {
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    })
  }
}