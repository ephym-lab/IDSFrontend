import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-700',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <Skeleton className="h-6 w-24 mb-4" />
      <Skeleton className="h-12 w-full mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-3 pt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
