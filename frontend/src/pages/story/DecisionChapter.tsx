import type { UseQueryResult } from '@tanstack/react-query'
import type { DayResponse } from '../../api/types'
import { Chapter } from '../../components/ui/Chapter'
import { QueryState } from '../../components/ui/QueryState'
import { Reveal } from '../../components/ui/Reveal'
import { DecisionTimeline } from '../../features/story/DecisionTimeline'
import type { StoryFacts } from '../../features/story/facts'
import { CUTOFF_LEAD_RANGE_H } from '../../lib/constants'
import { formatHours } from '../../lib/format'

interface DecisionChapterProps {
  dayQuery: UseQueryResult<DayResponse>
  facts: StoryFacts | null
}

function leadText(facts: StoryFacts | null): string {
  const range = `${formatHours(CUTOFF_LEAD_RANGE_H.min)} to ${formatHours(CUTOFF_LEAD_RANGE_H.max)}`
  const run = facts?.runClock ? `the ${facts.runClock} run` : 'a single forecast run'
  return `Day-ahead bids close at 11:00 UK time. Whatever forecast you hold at that instant is what you buy against. Every day of January that was ${run}, published ${range} ahead of the hours it covers.`
}

export function DecisionChapter({ dayQuery, facts }: DecisionChapterProps) {
  return (
    <Chapter
      id="decision"
      number="01"
      kicker="Chapter one · The decision"
      title="11:00, the day before: the moment you commit"
      lead={leadText(facts)}
      tone="white"
    >
      <Reveal>
        <QueryState query={dayQuery} skeletonHeight={180}>
          {(day) => <DecisionTimeline day={day} />}
        </QueryState>
      </Reveal>
    </Chapter>
  )
}
