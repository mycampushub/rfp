import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string/Date to a consistent locale-aware format.
 * Uses the user's locale from the browser.
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "N/A"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "Invalid date"
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  })
}

/**
 * Format a date with time.
 */
export function formatDateTime(
  date: string | Date | null | undefined
): string {
  if (!date) return "N/A"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "Invalid date"
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format a relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(
  date: string | Date | null | undefined
): string {
  if (!date) return "N/A"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "Invalid date"
  const now = Date.now()
  const diff = now - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(d)
}

/**
 * Format a number as currency.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency = "USD"
): string {
  if (amount == null) return "N/A"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a number with commas.
 */
export function formatNumber(
  num: number | null | undefined
): string {
  if (num == null) return "N/A"
  return new Intl.NumberFormat().format(num)
}
