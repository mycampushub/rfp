"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  FileText,
  Users,
  MessageSquare,
  Star,
  CheckSquare,
  Settings,
  BarChart3,
  ChevronDown,
  ChevronRight,
  LogOut,
  Bell,
  Calendar,
  Store,
  Search,
  User,
  TrendingUp,
  Menu,
  ShieldCheck
} from "lucide-react"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "RFPs",
    href: "/rfps",
    icon: FileText,
  },
  {
    title: "Vendors",
    href: "/vendors",
    icon: Users,
  },
  {
    title: "Marketplace",
    href: "/marketplace",
    icon: Store,
    children: [
      {
        title: "Browse RFPs",
        href: "/marketplace/rfps",
        icon: Search,
      },
      {
        title: "Vendor Directory",
        href: "/marketplace/vendors",
        icon: Users,
      },
      {
        title: "My Activity",
        href: "/marketplace/my-activity",
        icon: User,
      },
      {
        title: "Analytics",
        href: "/marketplace/analytics",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Q&A",
    href: "/qa",
    icon: MessageSquare,
  },
  {
    title: "Evaluation",
    href: "/evaluation",
    icon: Star,
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: CheckSquare,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Messages",
    href: "/messages",
    icon: MessageSquare,
  },
  {
    title: "Announcements",
    href: "/announcements",
    icon: Bell,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Admin",
    href: "/admin",
    icon: ShieldCheck,
  },
  {
    title: "Vendor Portal",
    href: "/vendor-dashboard",
    icon: Store,
    children: [
      { title: "Vendor Dashboard", href: "/vendor-dashboard", icon: LayoutDashboard },
      { title: "Users", href: "/vendor-dashboard/users", icon: Users },
      { title: "Notifications", href: "/vendor-dashboard/notifications", icon: Bell },
    ]
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(["/marketplace"]))

  const handleNavClick = () => {
    onNavigate?.()
  }

  const toggleExpand = (href: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(href)) next.delete(href)
      else next.add(href)
      return next
    })
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-6">
            <h2 className="text-lg font-semibold">RFP Platform</h2>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              if (item.children) {
                const isChildActive = item.children.some(child => pathname === child.href)
                const isExpanded = expandedItems.has(item.href)
                return (
                  <div key={item.href} className="space-y-1">
                    <Button
                      variant={isChildActive ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => toggleExpand(item.href)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                      {isExpanded ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />}
                    </Button>
                    {isExpanded && (
                      <div className="ml-4 space-y-1">
                        {item.children.map((child) => {
                          const childIsActive = pathname === child.href
                          return (
                            <Button
                              key={child.href}
                              variant={childIsActive ? "secondary" : "ghost"}
                              className="w-full justify-start text-sm"
                              asChild
                            >
                              <Link href={child.href} onClick={handleNavClick}>
                                <child.icon className="mr-2 h-3 w-3" />
                                {child.title}
                              </Link>
                            </Button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href} onClick={handleNavClick}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {session && (
        <div className="px-3 py-2 border-t">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Signed in as:
            </div>
            <div className="text-sm font-medium truncate">
              {session.user.email}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => { handleNavClick(); signOut() }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      )}
    </ScrollArea>
  )
}

export function SidebarMobileTrigger() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}

export function Sidebar({ className }: { className?: string }) {
  return (
    <div className={cn("pb-12 w-64", className)}>
      <SidebarContent />
    </div>
  )
}
