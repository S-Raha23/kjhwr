import { useQuery } from '@tanstack/react-query'
import { getMeta } from '../api/endpoints'
import { QUERY_STALE_MS } from '../lib/constants'

export function useMeta() {
  return useQuery({ queryKey: ['meta'], queryFn: getMeta, staleTime: QUERY_STALE_MS })
}
