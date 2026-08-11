"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"

export default function RfpBuilderRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/rfps/create") }, [router])
  return (
    <MainLayout title="RFP Builder">
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h1 className="text-2xl font-bold tracking-tight mb-4">RFP Builder</h1>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </MainLayout>
  )
}