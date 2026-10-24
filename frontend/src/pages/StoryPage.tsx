import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AnalysisParams } from '../api/types'
import { Hero } from '../features/story/Hero'
import { buildStoryFacts } from '../features/story/facts'
import { useDay } from '../hooks/useDay'
import { useHorizonCurve } from '../hooks/useHorizonCurve'
import { useMetrics } from '../hooks/useMetrics'
import { useSeries } from '../hooks/useSeries'
import { DEFAULT_HORIZON_H, PERIOD_END, PERIOD_START, ROUTES } from '../lib/constants'
import { worstDayRows } from '../lib/rank'
import { BiasChapter } from './story/BiasChapter'
import { DayChapter } from './story/DayChapter'
import { DecisionChapter } from './story/DecisionChapter'
import { DeskChapter } from './story/DeskChapter'
import { MonthChapter } from './story/MonthChapter'
import { WaitingChapter } from './story/WaitingChapter'

/** The story always tells the default view: the whole period at the 11:00 D-1 decision point. */
const STORY_PARAMS: AnalysisParams = {
  start: PERIOD_START,
  end: PERIOD_END,
  mode: 'cutoff',
  horizonH: DEFAULT_HORIZON_H,
}

export default function StoryPage() {
  const navigate = useNavigate()
  const metrics = useMetrics(STORY_PARAMS)
  const series = useSeries(STORY_PARAMS)
  const curve = useHorizonCurve(PERIOD_START, PERIOD_END)

  const hardestDays = useMemo(() => worstDayRows(metrics.data?.by_day ?? []), [metrics.data])
  const [pickedDay, setPickedDay] = useState<string | null>(null)
  const featuredDay = pickedDay ?? hardestDays[0]?.day ?? null
  const dayQuery = useDay(featuredDay, PERIOD_START, PERIOD_END)

  const facts = useMemo(
    () => (metrics.data && curve.data ? buildStoryFacts(metrics.data, curve.data.points) : null),
    [metrics.data, curve.data],
  )
  const openDay = (day: string) => navigate(`${ROUTES.explore}?day=${day}`)

  return (
    <>
      <Hero summary={metrics.data?.summary} exploreHref={ROUTES.explore} />
      <DecisionChapter dayQuery={dayQuery} facts={facts} />
      <DayChapter
        dayQuery={dayQuery}
        rows={hardestDays}
        selectedDay={featuredDay}
        onPick={setPickedDay}
      />
      <MonthChapter seriesQuery={series} metricsQuery={metrics} onOpenDay={openDay} />
      <BiasChapter metricsQuery={metrics} seriesQuery={series} facts={facts} onOpenDay={openDay} />
      <WaitingChapter curveQuery={curve} facts={facts} />
      <DeskChapter summary={metrics.data?.summary} facts={facts} />
    </>
  )
}
