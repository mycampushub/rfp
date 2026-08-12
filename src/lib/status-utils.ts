// Shared status/priority/score color utilities — theme-aware for dark mode support

// Semantic status badge classes (work in both light and dark mode)
export function getStatusColor(status: string): string {
  switch (status) {
    case "published":
    case "active":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "draft":
    case "pending":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    case "evaluation":
    case "in_review":
    case "under_review":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-400"
    case "closed":
    case "rejected":
    case "cancelled":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    case "awarded":
    case "approved":
    case "completed":
      return "bg-violet-500/15 text-violet-700 dark:text-violet-400"
    case "archived":
    case "expired":
      return "bg-muted text-muted-foreground"
    case "open":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "answered":
    case "resolved":
      return "bg-teal-500/15 text-teal-700 dark:text-teal-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "critical":
    case "urgent":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    case "high":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-400"
    case "medium":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    case "low":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 75) return "text-sky-600 dark:text-sky-400"
  if (score >= 60) return "text-amber-600 dark:text-amber-400"
  if (score >= 40) return "text-orange-600 dark:text-orange-400"
  return "text-red-600 dark:text-red-400"
}

export function getScoreStars(score: number): string {
  const fullStars = Math.floor(score / 20)
  const halfStar = score % 20 >= 10 ? 1 : 0
  const emptyStars = 5 - fullStars - halfStar
  return "\u2605".repeat(fullStars) + (halfStar ? "\u00BD" : "") + "\u2606".repeat(emptyStars)
}

export function getPrequalificationColor(status: string): string {
  switch (status) {
    case "qualified":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "pending":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    case "not_qualified":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    case "in_progress":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function getPerformanceColor(rating: string): string {
  switch (rating) {
    case "excellent":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "good":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-400"
    case "average":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    case "poor":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function getAwardStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    case "approved":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    case "rejected":
      return "bg-red-500/15 text-red-700 dark:text-red-400"
    case "disputed":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}
