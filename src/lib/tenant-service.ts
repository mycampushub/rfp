import { db } from "@/lib/db"
import { DEFAULT_ROLES } from "@/types/auth"

export class TenantService {
  static async createTenant(data: {
    name: string
    region?: string
    plan?: string
    adminEmail: string
    adminName: string
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

    // Create admin user
    const adminUser = await db.user.create({
      data: {
        tenantId: tenant.id,
        email: data.adminEmail,
        name: data.adminName,
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
        roles: true,
      },
    })
  }

  static async updateTenantSettings(tenantId: string, settings: any) {
    return await db.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
        },
      },
    })
  }

  static async updateTenantBranding(tenantId: string, branding: any) {
    return await db.tenant.update({
      where: { id: tenantId },
      data: {
        branding: {
          ...branding,
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
          in: user.roleIds || [],
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

  static async createAuditLog(
    tenantId: string,
    actor: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata?: any,
    ip?: string
  ) {
    return await db.activityLog.create({
      data: {
        tenantId,
        actor,
        action,
        targetType,
        targetId,
        metadata,
        ip,
      },
    })
  }

  static async getAuditLogs(tenantId: string, options?: {
    limit?: number
    offset?: number
    actor?: string
    targetType?: string
    startDate?: Date
    endDate?: Date
  }) {
    const where: any = { tenantId }

    if (options?.actor) {
      where.actor = options.actor
    }
    if (options?.targetType) {
      where.targetType = options.targetType
    }
    if (options?.startDate || options?.endDate) {
      where.timestamp = {}
      if (options.startDate) {
        where.timestamp.gte = options.startDate
      }
      if (options.endDate) {
        where.timestamp.lte = options.endDate
      }
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      db.activityLog.count({ where }),
    ])

    return { logs, total }
  }
}