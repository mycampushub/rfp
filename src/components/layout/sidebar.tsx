"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  MessageSquare, 
  Star, 
  CheckSquare, 
  Settings, 
  BarChart3,
  LogOut,
  Bell,
  Calendar,
  Store,
  Search,
  User,
  TrendingUp
} from "lucide-react"
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
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className={cn("pb-12 w-64", className)}>
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
                return (
                  <div key={item.href} className="space-y-1">
                    <Button
                      variant={isChildActive ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href={item.href}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                      </Link>
                    </Button>
                    {isChildActive && (
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
                              <Link href={child.href}>
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
                  <Link href={item.href}>
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
            <div className="text-sm font-medium">
              {session.user.email}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}