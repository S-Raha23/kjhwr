import { useQuery } from '@tanstack/react-query'
import { getSeries } from '../api/endpoints'
import type { AnalysisParams } from '../api/types'
import { QUERY_STALE_MS } from '../lib/constants'

export function useSeries(params: AnalysisParams) {
  return useQuery({
    queryKey: ['series', params],
    queryFn: () => getSeries(params),
    staleTime: QUERY_STALE_MS,
  })
}
