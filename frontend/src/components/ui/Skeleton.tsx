interface SkeletonProps {
  height?: number
}

export function Skeleton({ height = 160 }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="w-full animate-pulse rounded-lg bg-slate-100"
      style={{ height }}
    />
  )
}
