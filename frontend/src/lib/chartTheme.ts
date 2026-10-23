export const COLORS = {
  actual: '#1e293b',
  forecast: '#4f46e5',
  band: '#c7d2fe',
  /** Forecast too high: the buyer would be short. */
  over: '#d97706',
  /** Forecast too low: the buyer would be long. */
  under: '#2563eb',
  grid: '#e2e8f0',
  axis: '#64748b',
  marker: '#94a3b8',
} as const

export const AXIS = {
  tick: { fontSize: 12, fill: COLORS.axis },
  stroke: COLORS.grid,
} as const

export const CHART_HEIGHT = 288
export const LINE_WIDTH = 1.5
export const LEGEND_STYLE = { fontSize: 12 } as const
export const TOOLTIP_STYLE = {
  contentStyle: { fontSize: 12, borderRadius: 8, borderColor: COLORS.grid },
} as const
