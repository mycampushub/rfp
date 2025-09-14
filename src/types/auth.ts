export interface User {
  id: string
  email: string
  name?: string
  tenantId: string
  roleIds: string[]
}

export interface Role {
  id: string
  name: string
  permissions: string[]
}

export interface Tenant {
  id: string
  name: string
  region?: string
  plan: string
  settings?: any
  branding?: any
}

export interface SessionUser {
  id: string
  email: string
  name?: string
  tenantId: string
  roleIds: string[]
}

export interface JWT {
  sub: string
  tenantId: string
  roleIds: string[]
  iat?: number
  exp?: number
}

export interface Session {
  user: SessionUser
  expires: string
}

// Role-based permissions
export const PERMISSIONS = {
  // RFP Management
  CREATE_RFP: "rfp:create",
  EDIT_RFP: "rfp:edit",
  DELETE_RFP: "rfp:delete",
  PUBLISH_RFP: "rfp:publish",
  VIEW_RFP: "rfp:view",
  
  // Vendor Management
  CREATE_VENDOR: "vendor:create",
  EDIT_VENDOR: "vendor:edit",
  DELETE_VENDOR: "vendor:delete",
  INVITE_VENDOR: "vendor:invite",
  
  // Evaluation
  CREATE_SCORE: "score:create",
  EDIT_SCORE: "score:edit",
  VIEW_SCORES: "score:view",
  FINALIZE_SCORES: "score:finalize",
  
  // Approvals
  CREATE_APPROVAL: "approval:create",
  EDIT_APPROVAL: "approval:edit",
  VIEW_APPROVALS: "approval:view",
  
  // Admin
  MANAGE_USERS: "admin:users",
  MANAGE_ROLES: "admin:roles",
  MANAGE_TENANT: "admin:tenant",
  VIEW_AUDIT_LOGS: "admin:audit",
  
  // System
  SYSTEM_ADMIN: "system:admin"
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Default roles with their permissions
export const DEFAULT_ROLES = {
  SYSTEM_ADMIN: {
    name: "System Admin",
    permissions: Object.values(PERMISSIONS)
  },
  TENANT_ADMIN: {
    name: "Tenant Admin", 
    permissions: [
      PERMISSIONS.CREATE_RFP,
      PERMISSIONS.EDIT_RFP,
      PERMISSIONS.DELETE_RFP,
      PERMISSIONS.PUBLISH_RFP,
      PERMISSIONS.VIEW_RFP,
      PERMISSIONS.CREATE_VENDOR,
      PERMISSIONS.EDIT_VENDOR,
      PERMISSIONS.DELETE_VENDOR,
      PERMISSIONS.INVITE_VENDOR,
      PERMISSIONS.CREATE_SCORE,
      PERMISSIONS.EDIT_SCORE,
      PERMISSIONS.VIEW_SCORES,
      PERMISSIONS.FINALIZE_SCORES,
      PERMISSIONS.CREATE_APPROVAL,
      PERMISSIONS.EDIT_APPROVAL,
      PERMISSIONS.VIEW_APPROVALS,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_ROLES,
      PERMISSIONS.MANAGE_TENANT,
      PERMISSIONS.VIEW_AUDIT_LOGS
    ]
  },
  RFP_OWNER: {
    name: "RFP Owner",
    permissions: [
      PERMISSIONS.CREATE_RFP,
      PERMISSIONS.EDIT_RFP,
      PERMISSIONS.PUBLISH_RFP,
      PERMISSIONS.VIEW_RFP,
      PERMISSIONS.CREATE_VENDOR,
      PERMISSIONS.INVITE_VENDOR,
      PERMISSIONS.CREATE_SCORE,
      PERMISSIONS.EDIT_SCORE,
      PERMISSIONS.VIEW_SCORES,
      PERMISSIONS.FINALIZE_SCORES,
      PERMISSIONS.CREATE_APPROVAL,
      PERMISSIONS.VIEW_APPROVALS
    ]
  },
  EDITOR: {
    name: "Editor",
    permissions: [
      PERMISSIONS.EDIT_RFP,
      PERMISSIONS.VIEW_RFP,
      PERMISSIONS.CREATE_VENDOR,
      PERMISSIONS.INVITE_VENDOR
    ]
  },
  EVALUATOR: {
    name: "Evaluator",
    permissions: [
      PERMISSIONS.VIEW_RFP,
      PERMISSIONS.CREATE_SCORE,
      PERMISSIONS.EDIT_SCORE,
      PERMISSIONS.VIEW_SCORES
    ]
  },
  APPROVER: {
    name: "Approver",
    permissions: [
      PERMISSIONS.VIEW_RFP,
      PERMISSIONS.VIEW_APPROVALS,
      PERMISSIONS.CREATE_APPROVAL,
      PERMISSIONS.EDIT_APPROVAL
    ]
  },
  VIEWER: {
    name: "Viewer",
    permissions: [
      PERMISSIONS.VIEW_RFP
    ]
  },
  VENDOR: {
    name: "Vendor",
    permissions: [
      // Vendor permissions are handled separately through vendor-specific endpoints
    ]
  }
} as const

export type UserRole = keyof typeof DEFAULT_ROLES