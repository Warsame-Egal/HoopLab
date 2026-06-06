import { useMemo, useState } from 'react'
import { VirtualList } from './ui/VirtualList'
import { cn } from '../lib/utils'
import type { PlayByPlayEvent } from '../types/scoreboard'

type PlayByPlayFeedProps = {
  plays: PlayByPlayEvent[]
  isLoading?: boolean
  live?: boolean
}

function formatClock(clock: string | null): string {
  if (!clock) return ''
  if (clock.startsWith('PT')) {
    const match = clock.match(/PT(\d+)M(\d+(?:\.\d+)?)?S/)
    if (match) {
      const mins = match[1]
      const secs = match[2] ? Math.floor(Number.parseFloat(match[2])) : 0
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    const minutesOnly = clock.match(/PT(\d+)M/)
    if (minutesOnly) return `${minutesOnly[1]}:00`
    const secondsOnly = clock.match(/PT(\d+)S/)
    if (secondsOnly) return `0:${secondsOnly[1].padStart(2, '0')}`
  }
  return clock
}

function isScoringPlay(play: PlayByPlayEvent): boolean {
  const type = play.action_type.toLowerCase()
  if (!type.includes('shot') && !type.includes('freethrow') && type !== '3pt' && type !== '2pt') {
    return false
  }
  if (play.shot_result) {
    return play.shot_result.toLowerCase() === 'made'
  }
  return !play.description.toLowerCase().includes('miss')
}

function periodLabel(period: number): string {
  if (period <= 0) return 'OT'
  if (period > 4) return `${period - 4}OT`
  return `Q${period}`
}

function PlayCard({
  play,
}: {
  play: PlayByPlayEvent
}) {
  const scoring = isScoringPlay(play)

  return (
    <div
      data-play-action-number={play.action_number}
      className={cn(
        'rounded-lg border border-transparent px-3 py-2.5 transition-colors',
        scoring ? 'border-brand/20 bg-brand/5' : 'bg-card hover:bg-muted/50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {play.team_tricode ? (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-foreground">
                {play.team_tricode}
              </span>
            ) : null}
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {formatClock(play.clock)}
            </span>
          </div>
          <p className={cn('text-sm leading-snug', scoring ? 'font-semibold text-foreground' : 'text-foreground')}>
            {play.description || play.action_type}
          </p>
        </div>
        {play.score_home != null && play.score_away != null ? (
          <span className="shrink-0 text-xs font-bold tabular-nums text-brand">
            {play.score_away} – {play.score_home}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function PlayByPlayFeed({ plays, isLoading, live }: PlayByPlayFeedProps) {
  const [scoringOnly, setScoringOnly] = useState(false)

  const sorted = useMemo(
    () => [...plays].sort((a, b) => b.action_number - a.action_number),
    [plays],
  )

  const filtered = useMemo(() => {
    if (!scoringOnly) return sorted
    return sorted.filter(
      (p) =>
        isScoringPlay(p) ||
        p.action_type.toLowerCase() === 'period' ||
        p.description.toLowerCase().includes('timeout'),
    )
  }, [sorted, scoringOnly])

  const playsByPeriod = useMemo(() => {
    const map: Record<number, PlayByPlayEvent[]> = {}
    for (const play of filtered) {
      const period = play.period || 0
      if (!map[period]) map[period] = []
      map[period].push(play)
    }
    return map
  }, [filtered])

  const periods = useMemo(
    () => Object.keys(playsByPeriod).map(Number).sort((a, b) => b - a),
    [playsByPeriod],
  )

  const useVirtual = filtered.length > 40

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Play-by-Play</h3>
          {live ? (
            <span className="flex items-center gap-1 rounded-full bg-live/10 px-2 py-0.5 text-xs font-semibold text-live">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live motion-reduce:animate-none" />
              Live
            </span>
          ) : null}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={scoringOnly}
            onChange={(e) => setScoringOnly(e.target.checked)}
            className="rounded border-border"
          />
          Scoring only
        </label>
      </div>

      {isLoading && plays.length === 0 ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          {plays.length === 0
            ? live
              ? 'Waiting for play-by-play from the NBA API…'
              : 'No play-by-play available yet.'
            : 'No plays match this filter.'}
        </p>
      ) : useVirtual ? (
        <VirtualList
          items={filtered}
          estimateSize={64}
          maxHeight={420}
          getKey={(play) => play.action_number}
          renderItem={(play) => <PlayCard play={play} />}
        />
      ) : (
        <div className="max-h-[28rem] space-y-6 overflow-y-auto p-4">
          {periods.map((period, idx) => (
            <div key={period}>
              <div className="mb-3 flex items-center gap-2 border-b-2 border-border pb-2">
                <span className="rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-brand-foreground">
                  {periodLabel(period)}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {playsByPeriod[period].length} plays
                </span>
              </div>
              <div className="space-y-2">
                {playsByPeriod[period].map((play) => (
                  <PlayCard key={play.action_number} play={play} />
                ))}
              </div>
              {idx < periods.length - 1 ? <div className="mt-6 border-t border-border" /> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
