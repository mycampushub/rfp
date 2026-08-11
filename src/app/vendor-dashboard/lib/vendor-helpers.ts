export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
    case "accepted":
    case "submitted":
    case "awarded":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "pending":
    case "under_review":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    case "declined":
    case "rejected":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    case "expired":
    case "inactive":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export const getMatchScoreColor = (score: number) => {
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 80) return "text-sky-600 dark:text-sky-400"
  if (score >= 70) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}
