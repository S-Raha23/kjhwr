import { useMemo, useState } from 'react'
import type { ByDayRow } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { WORST_DAYS_COUNT } from '../../lib/constants'
import {
  formatLondonDateTime,
  formatLondonDay,
  formatMw,
  formatMwh,
  formatPct,
  formatSignedMw,
} from '../../lib/format'
import { worstDays } from '../../lib/rank'

interface DailyTableProps {
  rows: ByDayRow[]
  selectedDay: string | null
  onSelectDay: (day: string) => void
}

type SortKey = 'day' | 'mae' | 'bias' | 'wape_pct' | 'forecast_mwh' | 'actual_mwh'
type Direction = 'asc' | 'desc'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'day', label: 'Delivery day' },
  { key: 'mae', label: 'MAE' },
  { key: 'bias', label: 'Bias' },
  { key: 'wape_pct', label: 'WAPE' },
  { key: 'forecast_mwh', label: 'Forecast energy' },
  { key: 'actual_mwh', label: 'Actual energy' },
]

export function DailyTable({ rows, selectedDay, onSelectDay }: DailyTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('day')
  const [direction, setDirection] = useState<Direction>('asc')
  const worst = useMemo(() => new Set(worstDays(rows)), [rows])

  const sorted = useMemo(() => {
    const factor = direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) =>
      sortKey === 'day' ? factor * a.day.localeCompare(b.day) : factor * (a[sortKey] - b[sortKey]),
    )
  }, [rows, sortKey, direction])

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setDirection(direction === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setDirection(key === 'day' ? 'asc' : 'desc')
    }
  }

  return (
    <Card
      title="⑦ Daily accuracy"
      subtitle={`Click a row to open it in the delivery-day panel. The ${WORST_DAYS_COUNT} worst days by MAE are marked ▲.`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    sortKey === column.key
                      ? direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  className="py-2 pr-3 font-medium"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className="focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {column.label}
                    {sortKey === column.key && (direction === 'asc' ? ' ↑' : ' ↓')}
                  </button>
                </th>
              ))}
              <th scope="col" className="py-2 font-medium">
                Forecast run used
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.day}
                onClick={() => onSelectDay(row.day)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                  row.day === selectedDay ? 'bg-indigo-50' : ''
                }`}
              >
                <td className="py-1.5 pr-3">
                  <button
                    type="button"
                    onClick={() => onSelectDay(row.day)}
                    className="font-medium text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {formatLondonDay(row.day)}
                  </button>
                  {worst.has(row.day) && (
                    <span className="ml-1 text-amber-600" title="Among the worst days by MAE">
                      ▲
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-3">{formatMw(row.mae)}</td>
                <td className="py-1.5 pr-3">{formatSignedMw(row.bias)}</td>
                <td className="py-1.5 pr-3">{formatPct(row.wape_pct)}</td>
                <td className="py-1.5 pr-3">{formatMwh(row.forecast_mwh)}</td>
                <td className="py-1.5 pr-3">{formatMwh(row.actual_mwh)}</td>
                <td className="py-1.5">{formatLondonDateTime(row.forecast_published)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
