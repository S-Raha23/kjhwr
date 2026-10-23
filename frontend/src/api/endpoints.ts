import { apiGet } from './client'
import type {
  AnalysisParams,
  DayResponse,
  HorizonCurveResponse,
  Meta,
  MetricsResponse,
  SeriesResponse,
} from './types'

function analysisQuery({ start, end, mode, horizonH }: AnalysisParams) {
  return { start, end, mode, horizon_h: mode === 'horizon' ? horizonH : undefined }
}

export const getMeta = () => apiGet<Meta>('/meta')

export const getSeries = (params: AnalysisParams) =>
  apiGet<SeriesResponse>('/series', analysisQuery(params))

export const getMetrics = (params: AnalysisParams) =>
  apiGet<MetricsResponse>('/metrics', analysisQuery(params))

export const getHorizonCurve = (start: string, end: string) =>
  apiGet<HorizonCurveResponse>('/horizon-curve', { start, end })

export const getDay = (date: string, start: string, end: string) =>
  apiGet<DayResponse>('/day', { date, start, end })
