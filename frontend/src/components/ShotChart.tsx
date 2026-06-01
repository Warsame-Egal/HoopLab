import type { Shot } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const COURT_W = 500
const COURT_H = 470

function scale(value: number, max: number, size: number) {
  return ((value + max) / (max * 2)) * size
}

export function ShotChart({ shots }: { shots: Shot[] }) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-gray-900">Shot Chart</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <svg viewBox={`0 0 ${COURT_W} ${COURT_H}`} className="mx-auto h-80 w-full max-w-xl">
          <rect x="0" y="0" width={COURT_W} height={COURT_H} fill="#f5f5f5" rx="16" />
          <path
            d={`M ${COURT_W / 2 - 80} 0 L ${COURT_W / 2 + 80} 0 L ${COURT_W / 2 + 80} 120 Q ${COURT_W / 2} 180 ${COURT_W / 2 - 80} 120 Z`}
            fill="none"
            stroke="#d4d4d4"
            strokeWidth="2"
          />
          <line x1="0" y1="0" x2={COURT_W} y2="0" stroke="#a3a3a3" strokeWidth="3" />
          {shots.slice(0, 500).map((shot, index) => (
            <circle
              key={`${shot.locX}-${shot.locY}-${index}`}
              cx={scale(shot.locX, 250, COURT_W)}
              cy={scale(shot.locY, 50, COURT_H * 0.55) + 20}
              r="4"
              fill={shot.made ? '#10b981' : '#ef4444'}
              opacity="0.75"
            />
          ))}
        </svg>
        <div className="mt-3 flex items-center justify-center gap-5">
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="h-3 w-3 rounded-full" style={{ background: '#10b981' }} />
            Made
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="h-3 w-3 rounded-full" style={{ background: '#ef4444' }} />
            Missed
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
