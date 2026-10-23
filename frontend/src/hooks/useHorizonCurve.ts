import { useQuery } from '@tanstack/react-query'
import { getHorizonCurve } from '../api/endpoints'
import { QUERY_STALE_MS } from '../lib/constants'

export function useHorizonCurve(start: string, end: string) {
  return useQuery({
    queryKey: ['horizon-curve', start, end],
    queryFn: () => getHorizonCurve(start, end),
    staleTime: QUERY_STALE_MS,
  })
}
