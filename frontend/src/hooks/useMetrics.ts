import { useQuery } from '@tanstack/react-query'
import { getMetrics } from '../api/endpoints'
import type { AnalysisParams } from '../api/types'
import { QUERY_STALE_MS } from '../lib/constants'

export function useMetrics(params: AnalysisParams) {
  return useQuery({
    queryKey: ['metrics', params],
    queryFn: () => getMetrics(params),
    staleTime: QUERY_STALE_MS,
  })
}
