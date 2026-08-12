"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { ErrorBoundary } from "@/components/error-boundary"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  hideBreadcrumbs?: boolean
}

export function MainLayout({ children, title, hideBreadcrumbs }: MainLayoutProps) {
  const router = useRouter()

  useKeyboardShortcuts({
    'mod+n': () => router.push('/rfps/create'),
    'mod+b': () => router.push('/rfps'),
  })

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 border-r bg-background">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {!hideBreadcrumbs && <Breadcrumbs />}
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  )
}