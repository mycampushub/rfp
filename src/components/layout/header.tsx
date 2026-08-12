"use client"

import { Bell, Search, Moon, Sun } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { SidebarMobileTrigger } from "./sidebar"
import { formatDate } from "@/lib/utils"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useDebounce } from "@/hooks/use-debounce"

interface HeaderProps {
  title?: string
}

interface Notification {
  id: string
  title: string
  createdAt: string
  read: boolean
  actionUrl?: string | null
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [dialogQuery, setDialogQuery] = useState("")
  const dialogInputRef = useRef<HTMLInputElement>(null)
  const debouncedDialogQuery = useDebounce(dialogQuery, 300)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=5&unreadOnly=true")
      if (!res.ok) return
      const data = await res.json()
      const items = Array.isArray(data) ? data : data?.notifications ?? []
      setNotifications(items)
      setUnreadCount(items.length)
    } catch (err) { console.error("Failed to fetch notifications:", err) }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push("/dashboard")
    }
  }

  const handleDialogSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = debouncedDialogQuery.trim()
    if (query) {
      setSearchOpen(false)
      setDialogQuery("")
      router.push(`/dashboard?search=${encodeURIComponent(query)}`)
    }
  }

  useKeyboardShortcuts({
    "mod+k": () => setSearchOpen(true),
  })

  // Auto-focus dialog input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => dialogInputRef.current?.focus(), 100)
    }
  }, [searchOpen])

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-2 md:px-4">
        {/* Mobile sidebar trigger */}
        <SidebarMobileTrigger />

        {/* Title - hidden on very small screens, shown on md+ */}
        <div className="hidden md:block mr-4">
          <h1 className="text-lg font-semibold truncate">{title || "RFP Platform"}</h1>
        </div>

        <div className="flex flex-1 items-center space-x-2 justify-between">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-8 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left cursor-pointer"
              >
                Search...
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>
          </div>

          {/* Search Dialog (Cmd+K) */}
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Search</DialogTitle>
                <DialogDescription>
                  Search RFPs, vendors, and more across the platform.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleDialogSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={dialogInputRef}
                    type="search"
                    placeholder="Type to search..."
                    className="pl-10"
                    value={dialogQuery}
                    onChange={(e) => setDialogQuery(e.target.value)}
                  />
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <nav className="flex items-center space-x-1 md:space-x-2">
            {/* Dark mode toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Notifications */}
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 pb-2">
                  <h4 className="text-sm font-semibold">Notifications</h4>
                  <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                </div>
                <Separator />
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No unread notifications
                    </div>
                  ) : (
                    <div className="p-2">
                      {notifications.map((notif) => (
                        <a
                          key={notif.id}
                          href={notif.actionUrl || undefined}
                          onClick={(e) => {
                            if (notif.actionUrl) {
                              e.preventDefault()
                              setNotifOpen(false)
                              router.push(notif.actionUrl)
                            }
                          }}
                          className="block rounded-md p-2 hover:bg-accent transition-colors"
                        >
                          <p className="text-sm font-medium leading-tight">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notif.createdAt)}
                          </p>
                        </a>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <Separator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-sm"
                    onClick={() => {
                      setNotifOpen(false)
                      toast.info('Full notifications page coming soon')
                    }}
                  >
                    View All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* User menu */}
            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {session.user.name?.[0] || session.user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/settings")}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open("mailto:support@rfpplatform.com", "_blank")}>Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}