"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Route label mapping for breadcrumb display names.
 * Add entries for new routes here.
 */
const ROUTE_LABELS: Record<string, string> = {
  "": "Home",
  dashboard: "Dashboard",
  rfps: "RFPs",
  create: "Create",
  edit: "Edit",
  vendors: "Vendors",
  marketplace: "Marketplace",
  register: "Register",
  analytics: "Analytics",
  "my-activity": "My Activity",
  bids: "Bids",
  evaluation: "Evaluation",
  approvals: "Approvals",
  messages: "Messages",
  announcements: "Announcements",
  calendar: "Calendar",
  settings: "Settings",
  admin: "Admin",
  submit: "Submit",
  addenda: "Addenda",
  qa: "Q&A",
  connections: "Connections",
  notifications: "Notifications",
  users: "Users",
  roles: "Roles",
  about: "About",
  help: "Help",
  contact: "Contact",
  careers: "Careers",
  blog: "Blog",
  "api-docs": "API Docs",
  status: "Status",
  terms: "Terms",
  privacy: "Privacy",
  signin: "Sign In",
  signup: "Sign Up",
  "rfp-builder": "RFP Builder",
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname()

  // Skip breadcrumbs on home page
  if (pathname === "/") return null

  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; href: string; isLast: boolean }[] = []

  let accumulatedPath = ""
  for (let i = 0; i < segments.length; i++) {
    accumulatedPath += `/${segments[i]}`
    const isLast = i === segments.length - 1
    // Skip dynamic segments like [id] for label, use parent context
    const label =
      segments[i].startsWith("[")
        ? "Details"
        : ROUTE_LABELS[segments[i]] || segments[i].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    crumbs.push({ label, href: accumulatedPath, isLast })
  }

  // Don't render if only one crumb (e.g., /dashboard)
  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm text-muted-foreground mb-4", className)}>
      <Link href="/" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
