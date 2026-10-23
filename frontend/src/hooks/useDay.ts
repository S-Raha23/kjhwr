import { useQuery } from '@tanstack/react-query'
import { getDay } from '../api/endpoints'
import { QUERY_STALE_MS } from '../lib/constants'

/** Decision panel for one delivery day; `day` is null until the default day is known. */
export function useDay(day: string | null, start: string, end: string) {
  return useQuery({
    queryKey: ['day', day, start, end],
    queryFn: () => getDay(day as string, start, end),
    enabled: day !== null,
    staleTime: QUERY_STALE_MS,
  })
}
