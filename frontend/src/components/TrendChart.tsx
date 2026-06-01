import type { PlayerSeasonStats } from '../lib/api'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function TrendChart({ seasons }: { seasons: PlayerSeasonStats[] }) {
  const data = [...seasons]
    .reverse()
    .map((s) => ({ season: s.season, ppg: s.pts ?? 0 }))

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-gray-900">PPG Trend</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="season" tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: '#d4d4d4' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Line type="monotone" dataKey="ppg" stroke="#ea580c" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
