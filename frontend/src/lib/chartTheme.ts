export const COLORS = {
  actual: '#0b1220',
  forecast: '#0d8274',
  band: '#9aeadb',
  /** Forecast too high: the buyer would be short. */
  over: '#d97706',
  /** Forecast too low: the buyer would be long. */
  under: '#2563eb',
  grid: '#e3e8f0',
  axis: '#6b7a94',
  marker: '#9aa7bd',
  windEdge: '#2dbfaa',
  windCore: '#5fd6c4',
} as const

export const AXIS = {
  tick: { fontSize: 12, fill: COLORS.axis },
  stroke: COLORS.grid,
} as const

export const CHART_HEIGHT = 288
export const BRUSH_EXTRA_HEIGHT = 40
export const LINE_WIDTH = 2
export const LEGEND_STYLE = { fontSize: 12 } as const
export const TOOLTIP_STYLE = {
  contentStyle: { fontSize: 12, borderRadius: 12, borderColor: COLORS.grid },
} as const

/** Strongest tint of the daily-bias calendar cells (0-1 opacity scale). */
export const HEAT_MIN_OPACITY = 0.18
