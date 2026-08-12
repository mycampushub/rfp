import { MainLayout } from '@/components/layout/main-layout'
import { Skeleton } from "@/components/ui/skeleton"

export default function RfpsLoading() {
  return (
    <MainLayout>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="rounded-md border">
        <div className="border-b p-3"><div className="flex gap-4">{Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}</div></div>
        {Array.from({length: 5}).map((_, i) => <div key={i} className="border-b p-3 last:border-0"><div className="flex gap-4">{Array.from({length: 6}).map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}</div></div>)}
      </div>
    </div>
    </MainLayout>
  )
}
