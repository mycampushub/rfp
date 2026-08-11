"use client"

import { LucideIcon, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  /** Legacy flat prop pattern */
  actionLabel?: string
  onAction?: () => void
  /** Object prop pattern */
  action?: { label: string; onClick: () => void }
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  action,
}: EmptyStateProps) {
  // Prefer the `action` object; fall back to `actionLabel`/`onAction`
  const resolvedAction = action ?? (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined)

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {description}
        </p>
      )}
      {resolvedAction && (
        <Button onClick={resolvedAction.onClick} size="sm">
          {resolvedAction.label}
        </Button>
      )}
    </div>
  )
}
