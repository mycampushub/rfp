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
  settings?: Record<string, unknown>
  branding?: Record<string, unknown>
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
  
  // Evaluation
  VIEW_EVALUATIONS: "evaluation:view",
  MANAGE_EVALUATIONS: "evaluation:manage",

  // Submissions
  VIEW_SUBMISSION: "submission:view",
  CREATE_SUBMISSION: "submission:create",
  EDIT_SUBMISSION: "submission:edit",
  DELETE_SUBMISSION: "submission:delete",

  // Files
  MANAGE_FILES: "file:manage",

  // Announcements
  MANAGE_ANNOUNCEMENTS: "announcement:manage",

  // Approvals
  CREATE_APPROVAL: "approval:create",
  EDIT_APPROVAL: "approval:edit",
  VIEW_APPROVALS: "approval:view",
  MANAGE_APPROVALS: "approval:manage",

  // Messages
  CREATE_MESSAGE: "message:create",
  MANAGE_MESSAGES: "message:manage",

  // Bids
  CREATE_BID: "bid:create",

  // Vendor Management
  MANAGE_VENDORS: "vendor:manage",

  // Analytics
  VIEW_ANALYTICS: "analytics:view",

  // Calendar
  MANAGE_CALENDAR: "calendar:manage",

  // Admin
  MANAGE_USERS: "admin:users",
  MANAGE_ROLES: "admin:roles",
  MANAGE_TENANT: "admin:tenant",
  VIEW_AUDIT_LOGS: "admin:audit",
  MANAGE_WEBHOOKS: "admin:webhooks",

  // Integrations
  MANAGE_INTEGRATIONS: "admin:integrations",

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