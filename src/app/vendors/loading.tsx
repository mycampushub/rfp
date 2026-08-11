import { Skeleton } from "@/components/ui/skeleton"

export default function VendorsLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}