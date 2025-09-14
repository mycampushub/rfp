import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PERMISSIONS, type Permission } from "@/types/auth"

export class PermissionsManager {
  static async hasPermission(
    permission: Permission | Permission[],
    tenantId?: string
  ): Promise<boolean> {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || !session?.user?.tenantId) {
        return false
      }

      // Check tenant context
      if (tenantId && session.user.tenantId !== tenantId) {
        return false
      }

      // Get user's roles and permissions
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { roleIds: true },
      })

      if (!user?.roleIds) {
        return false
      }

      // Get all permissions from user's roles
      const roles = await db.role.findMany({
        where: {
          id: {
            in: user.roleIds,
          },
          tenantId: session.user.tenantId,
        },
        select: { permissions: true },
      })

      const userPermissions = new Set<Permission>()
      roles.forEach((role) => {
        if (role.permissions) {
          (role.permissions as Permission[]).forEach((perm) => {
            userPermissions.add(perm)
          })
        }
      })

      // Check if user has the required permission(s)
      const permissionsToCheck = Array.isArray(permission) ? permission : [permission]
      return permissionsToCheck.every((perm) => userPermissions.has(perm))
    } catch (error) {
      console.error("Error checking permissions:", error)
      return false
    }
  }

  static async requirePermission(
    permission: Permission | Permission[],
    tenantId?: string
  ): Promise<void> {
    const hasPermission = await this.hasPermission(permission, tenantId)
    if (!hasPermission) {
      throw new Error("Insufficient permissions")
    }
  }

  static async getUserPermissions(userId: string, tenantId: string): Promise<Permission[]> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { roleIds: true },
      })

      if (!user?.roleIds) {
        return []
      }

      const roles = await db.role.findMany({
        where: {
          id: {
            in: user.roleIds,
          },
          tenantId,
        },
        select: { permissions: true },
      })

      const permissions = new Set<Permission>()
      roles.forEach((role) => {
        if (role.permissions) {
          (role.permissions as Permission[]).forEach((perm) => {
            permissions.add(perm)
          })
        }
      })

      return Array.from(permissions)
    } catch (error) {
      console.error("Error getting user permissions:", error)
      return []
    }
  }

  static async hasRole(roleName: string, tenantId?: string): Promise<boolean> {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || !session?.user?.tenantId) {
        return false
      }

      if (tenantId && session.user.tenantId !== tenantId) {
        return false
      }

      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { roleIds: true },
      })

      if (!user?.roleIds) {
        return false
      }

      const role = await db.role.findFirst({
        where: {
          name: roleName,
          id: {
            in: user.roleIds,
          },
          tenantId: session.user.tenantId,
        },
      })

      return !!role
    } catch (error) {
      console.error("Error checking role:", error)
      return false
    }
  }

  static async requireRole(roleName: string, tenantId?: string): Promise<void> {
    const hasRole = await this.hasRole(roleName, tenantId)
    if (!hasRole) {
      throw new Error(`Required role: ${roleName}`)
    }
  }

  static async isTenantAdmin(tenantId?: string): Promise<boolean> {
    return this.hasRole("Tenant Admin", tenantId)
  }

  static async isSystemAdmin(): Promise<boolean> {
    return this.hasPermission(PERMISSIONS.SYSTEM_ADMIN)
  }

  static async canAccessRFP(rfpId: string): Promise<boolean> {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || !session?.user?.tenantId) {
        return false
      }

      const rfp = await db.rFP.findFirst({
        where: {
          id: rfpId,
          tenantId: session.user.tenantId,
        },
      })

      if (!rfp) {
        return false
      }

      // Check if user is on the RFP team
      const teamMember = await db.rFP_Team.findFirst({
        where: {
          rfpId,
          userId: session.user.id,
        },
      })

      if (teamMember) {
        return true
      }

      // Check if user has general RFP view permission
      return this.hasPermission(PERMISSIONS.VIEW_RFP, session.user.tenantId)
    } catch (error) {
      console.error("Error checking RFP access:", error)
      return false
    }
  }

  static async canModifyRFP(rfpId: string): Promise<boolean> {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || !session?.user?.tenantId) {
        return false
      }

      const rfp = await db.rFP.findFirst({
        where: {
          id: rfpId,
          tenantId: session.user.tenantId,
        },
      })

      if (!rfp) {
        return false
      }

      // Check if user is on the RFP team with appropriate role
      const teamMember = await db.rFP_Team.findFirst({
        where: {
          rfpId,
          userId: session.user.id,
          role: {
            in: ["owner", "editor"],
          },
        },
      })

      if (teamMember) {
        return true
      }

      // Check if user has general RFP edit permission
      return this.hasPermission(PERMISSIONS.EDIT_RFP, session.user.tenantId)
    } catch (error) {
      console.error("Error checking RFP modification access:", error)
      return false
    }
  }
}