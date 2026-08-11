import { db } from "@/lib/db"
import type { Prisma } from "@prisma/client"
import { randomUUID } from "crypto"
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

    // Create admin user (password should be changed on first login)
    const adminRole = roles.find(r => r.name === "Tenant Admin")
    const tempPassword = randomUUID()
    const adminUser = await db.user.create({
      data: {
        tenantId: tenant.id,
        email: data.adminEmail,
        name: data.adminName,
        password: tempPassword,
        roleIds: [adminRole!.id] as Prisma.JsonArray,
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

  static async updateTenantSettings(tenantId: string, settings: Record<string, unknown>) {
    return await db.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
        } as Prisma.InputJsonValue,
      },
    })
  }

  static async updateTenantBranding(tenantId: string, branding: Record<string, unknown>) {
    return await db.tenant.update({
      where: { id: tenantId },
      data: {
        branding: {
          ...branding,
        } as Prisma.InputJsonValue,
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

  static async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
      },
    })

    if (!user || user.tenantId !== tenantId) {
      return []
    }

    const roleIds = (user.roleIds as string[] | null) || []
    const roles = await db.role.findMany({
      where: {
        id: {
          in: roleIds,
        },
        tenantId,
      },
    })

    return roles.flatMap(role => {
      const perms = role.permissions as string[] | null
      return perms || []
    })
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
    metadata?: Record<string, unknown>,
    ip?: string
  ) {
    return await db.activityLog.create({
      data: {
        tenantId,
        actor,
        action,
        targetType,
        targetId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
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
    const timestampFilter: Prisma.DateTimeFilter = {}
    if (options?.startDate) {
      timestampFilter.gte = options.startDate
    }
    if (options?.endDate) {
      timestampFilter.lte = options.endDate
    }

    const where: Prisma.ActivityLogWhereInput = { tenantId }

    if (options?.actor) {
      where.actor = options.actor
    }
    if (options?.targetType) {
      where.targetType = options.targetType
    }
    if (options?.startDate || options?.endDate) {
      where.timestamp = timestampFilter
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
