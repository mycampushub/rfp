import { MainLayout } from '@/components/layout/main-layout'
import { Loader2 } from "lucide-react"

export default function MarketplaceLoading() {
  return (
    <MainLayout>
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </MainLayout>
  )
}
