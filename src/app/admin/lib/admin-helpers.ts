export const ALL_PERMISSIONS = [
  'VIEW_RFP', 'MANAGE_RFP', 'VIEW_VENDOR', 'MANAGE_VENDOR',
  'MANAGE_USERS', 'VIEW_AUDIT', 'MANAGE_TENANT', 'MANAGE_INTEGRATIONS',
  'VIEW_COMPLIANCE', 'MANAGE_COMPLIANCE', 'VIEW_ANALYTICS', 'MANAGE_SETTINGS',
]

export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "inactive":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export const getPlanColor = (plan: string) => {
  switch (plan) {
    case "enterprise":
      return "bg-violet-500/15 text-violet-700 dark:text-violet-400"
    case "standard":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-400"
    case "custom":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export const getComplianceStatusColor = (status: string) => {
  switch (status) {
    case "implemented":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "partial":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    case "not_implemented":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    case "not_applicable":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export const getReportStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "approved":
      return "bg-violet-500/15 text-violet-700 dark:text-violet-400"
    case "pending_review":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    case "draft":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export const getHealthStatusColor = (status: string) => {
  switch (status) {
    case "healthy":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "warning":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    case "critical":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export const getIntegrationStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "inactive":
      return "bg-muted text-muted-foreground"
    case "error":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export const getNotificationTypeColor = (type: string) => {
  switch (type) {
    case "email":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-400"
    case "sms":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "push":
      return "bg-violet-500/15 text-violet-700 dark:text-violet-400"
    case "in_app":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}
