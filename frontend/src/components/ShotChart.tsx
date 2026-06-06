import { useMemo, useState } from 'react'
import type { Shot } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { EmptyState } from './ui/EmptyState'
import { Skeleton } from './ui/Skeleton'

/** SVG viewBox: 500 wide (50 ft), 470 tall (baseline → half court). */
const COURT_W = 500
const COURT_H = 470
const HOOP_X = COURT_W / 2
const HOOP_Y = COURT_H - 5
const SCALE = COURT_W / 500 // loc in tenths of feet; full width = 500 tenths

function toSvgX(locX: number): number {
  return ((locX + 250) / 500) * COURT_W
}

function toSvgY(locY: number): number {
  return COURT_H - (locY / 470) * (COURT_H - 10)
}

function ft(n: number): number {
  return n * 10 * SCALE
}

type ShotChartProps = {
  shots: Shot[]
  loading?: boolean
}

export function ShotChart({ shots, loading = false }: ShotChartProps) {
  const [hovered, setHovered] = useState<Shot | null>(null)

  const { made, missed } = useMemo(() => {
    const m: Shot[] = []
    const miss: Shot[] = []
    for (const s of shots.slice(0, 800)) {
      if (s.made) m.push(s)
      else miss.push(s)
    }
    return { made: m, missed: miss }
  }, [shots])

  if (loading) {
    return (
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-foreground">Shot Chart</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Skeleton className="mx-auto h-80 w-full max-w-xl" />
        </CardContent>
      </Card>
    )
  }

  if (!shots.length) {
    return (
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-foreground">Shot Chart</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <EmptyState title="No shots" description="No shot chart data for this season." />
        </CardContent>
      </Card>
    )
  }

  const hoopCx = HOOP_X
  const hoopCy = HOOP_Y
  const backboardY = hoopCy - ft(4)
  const ftLineY = hoopCy - ft(19)
  const paintHalfW = ft(8)
  const threeCornerX = ft(22)
  const threeArcR = ft(23.75)
  const restrictedR = ft(4)

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-foreground">Shot Chart</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative mx-auto w-full max-w-xl">
          <svg
            viewBox={`0 0 ${COURT_W} ${COURT_H}`}
            className="h-auto w-full"
            role="img"
            aria-label="NBA half court shot chart"
          >
            <rect x="0" y="0" width={COURT_W} height={COURT_H} fill="var(--muted)" rx="8" />

            {/* Half-court boundary */}
            <line x1="0" y1="0" x2={COURT_W} y2="0" stroke="var(--border)" strokeWidth="2" />

            {/* 3-point line */}
            <path
              d={`M ${hoopCx - threeCornerX} ${hoopCy - ft(14)}
                 L ${hoopCx - threeCornerX} ${backboardY - ft(10)}
                 A ${threeArcR} ${threeArcR} 0 0 1 ${hoopCx + threeCornerX} ${backboardY - ft(10)}
                 L ${hoopCx + threeCornerX} ${hoopCy - ft(14)}`}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth="1.5"
            />

            {/* Paint / lane */}
            <rect
              x={hoopCx - paintHalfW}
              y={ftLineY}
              width={paintHalfW * 2}
              height={hoopCy - ftLineY}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth="1.5"
            />

            {/* Free-throw circle */}
            <circle
              cx={hoopCx}
              cy={ftLineY}
              r={ft(6)}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth="1.5"
            />

            {/* Restricted area */}
            <path
              d={`M ${hoopCx - restrictedR} ${hoopCy} A ${restrictedR} ${restrictedR} 0 0 1 ${hoopCx + restrictedR} ${hoopCy}`}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth="1.5"
            />

            {/* Backboard */}
            <line
              x1={hoopCx - ft(3)}
              x2={hoopCx + ft(3)}
              y1={backboardY}
              y2={backboardY}
              stroke="var(--foreground)"
              strokeWidth="3"
            />

            {/* Hoop */}
            <circle cx={hoopCx} cy={hoopCy} r="6" fill="none" stroke="var(--brand)" strokeWidth="2" />

            {/* Baseline */}
            <line x1="0" y1={COURT_H} x2={COURT_W} y2={COURT_H} stroke="var(--foreground)" strokeWidth="3" />

            {missed.map((shot, i) => (
              <circle
                key={`m-${i}`}
                cx={toSvgX(shot.locX)}
                cy={toSvgY(shot.locY)}
                r="3.5"
                fill="var(--live)"
                opacity="0.7"
                onMouseEnter={() => setHovered(shot)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
            {made.map((shot, i) => (
              <circle
                key={`g-${i}`}
                cx={toSvgX(shot.locX)}
                cy={toSvgY(shot.locY)}
                r="3.5"
                fill="var(--success)"
                opacity="0.85"
                onMouseEnter={() => setHovered(shot)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>

          {hovered ? (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs shadow-md">
              <span className={hovered.made ? 'text-success' : 'text-live'}>
                {hovered.made ? 'Made' : 'Missed'}
              </span>
              {hovered.zone ? <span className="text-muted-foreground"> · {hovered.zone}</span> : null}
              {hovered.distance != null ? (
                <span className="text-muted-foreground"> · {hovered.distance.toFixed(0)} ft</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-center gap-5">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-3 w-3 rounded-full bg-success" />
            Made ({made.length})
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-3 w-3 rounded-full bg-live" />
            Missed ({missed.length})
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
