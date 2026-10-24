interface SkeletonProps {
  height?: number
}

export function Skeleton({ height = 160 }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="w-full animate-pulse rounded-lg bg-ink-100"
      style={{ height }}
    />
  )
}
