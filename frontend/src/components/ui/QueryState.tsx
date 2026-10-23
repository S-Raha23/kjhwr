import type { ReactNode } from 'react'
import { ErrorState } from './ErrorState'
import { Skeleton } from './Skeleton'

interface QueryLike<T> {
  data: T | undefined
  isPending: boolean
  isError: boolean
  error: unknown
  refetch: () => unknown
}

interface QueryStateProps<T> {
  query: QueryLike<T>
  skeletonHeight?: number
  children: (data: T) => ReactNode
}

/** Renders a skeleton while loading, an error card with Retry on failure, else the data. */
export function QueryState<T>({ query, skeletonHeight, children }: QueryStateProps<T>) {
  if (query.isPending) return <Skeleton height={skeletonHeight} />
  if (query.isError || query.data === undefined) {
    const message = query.error instanceof Error ? query.error.message : 'Unknown error'
    return <ErrorState message={message} onRetry={() => void query.refetch()} />
  }
  return <>{children(query.data)}</>
}
