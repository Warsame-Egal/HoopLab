import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { Map } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { teamLogoUrl } from './TeamLogo'
import type { TeamMapPoint } from '../lib/api'
import 'leaflet/dist/leaflet.css'

export type MapMetric = 'winPct' | 'netRtg' | 'clutchNetRtg'

const US_CENTER: [number, number] = [39.8, -98.5]

const WIN_PCT_STOPS = [
  { min: 0.7, color: '#0369a1', label: '> 70%' },
  { min: 0.55, color: '#0ea5e9', label: '55–70%' },
  { min: 0.45, color: '#38bdf8', label: '45–55%' },
  { min: 0.3, color: '#7dd3fc', label: '30–45%' },
  { min: -Infinity, color: '#e0f2fe', label: '< 30%' },
]

const NET_RTG_STOPS = [
  { min: 5, color: '#6d28d9', label: '> +5' },
  { min: 2, color: '#8b5cf6', label: '+2 to +5' },
  { min: -2, color: '#a78bfa', label: '-2 to +2' },
  { min: -5, color: '#c4b5fd', label: '-5 to -2' },
  { min: -Infinity, color: '#ede9fe', label: '< -5' },
]

const CLUTCH_STOPS = [
  { min: 10, color: '#b45309', label: '> +10' },
  { min: 3, color: '#d97706', label: '+3 to +10' },
  { min: -3, color: '#f59e0b', label: '-3 to +3' },
  { min: -10, color: '#fcd34d', label: '-10 to -3' },
  { min: -Infinity, color: '#fef3c7', label: '< -10' },
]

function stopsFor(metric: MapMetric) {
  if (metric === 'winPct') return WIN_PCT_STOPS
  if (metric === 'clutchNetRtg') return CLUTCH_STOPS
  return NET_RTG_STOPS
}

function colorFor(metric: MapMetric, value: number | null): string {
  if (value == null) return '#d4d4d4'
  for (const stop of stopsFor(metric)) {
    if (value >= stop.min) return stop.color
  }
  return '#d4d4d4'
}

function metricValue(metric: MapMetric, team: TeamMapPoint): number | null {
  if (metric === 'winPct') return team.winPct
  if (metric === 'clutchNetRtg') return team.clutchNetRtg
  return team.netRtg
}

function formatMetric(metric: MapMetric, value: number | null): string {
  if (value == null) return '—'
  return metric === 'winPct' ? `${Math.round(value * 100)}%` : value.toFixed(1)
}

const METRIC_TITLES: Record<MapMetric, string> = {
  winPct: 'Team Map · Win %',
  netRtg: 'Team Map · Net Rating',
  clutchNetRtg: 'Team Map · Clutch Net Rating',
}

const METRIC_LABELS: Record<MapMetric, string> = {
  winPct: 'Win %',
  netRtg: 'Net Rating',
  clutchNetRtg: 'Clutch Net',
}

function logoIcon(team: TeamMapPoint, ringColor: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 42 : 30
  const border = isSelected ? 3 : 2
  const url = teamLogoUrl(team.abbreviation)
  const inner = url
    ? `<img src="${url}" alt="${team.abbreviation}" style="width:72%;height:72%;object-fit:contain;" onerror="this.style.display='none'"/>`
    : `<span style="font-size:10px;font-weight:600;color:#525252;">${team.abbreviation}</span>`
  const html = `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#fff;border:${border}px solid ${ringColor};box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;overflow:hidden;">${inner}</div>`
  return L.divIcon({
    html,
    className: 'team-logo-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    tooltipAnchor: [0, -size / 2],
  })
}

type TeamMapProps = {
  teams: TeamMapPoint[]
  metric: MapMetric
  selectedTeamId: number | null
  onSelectTeam: (teamId: number) => void
}

export function TeamMap({ teams, metric, selectedTeamId, onSelectTeam }: TeamMapProps) {
  const plotted = teams.filter((t) => t.latitude != null && t.longitude != null)

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="flex items-center gap-3 text-gray-900">
          <Map className="h-5 w-5 text-emerald-600" />
          {METRIC_TITLES[metric]}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="relative">
          <MapContainer
            center={US_CENTER}
            zoom={4}
            minZoom={3}
            maxZoom={7}
            style={{ height: 420, width: '100%', borderRadius: 8 }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap, &copy; CARTO'
            />
            {plotted.map((team) => {
              const value = metricValue(metric, team)
              const isSelected = team.teamId === selectedTeamId
              const ringColor = isSelected ? '#171717' : colorFor(metric, value)
              return (
                <Marker
                  key={team.teamId}
                  position={[team.latitude as number, team.longitude as number]}
                  icon={logoIcon(team, ringColor, isSelected)}
                  zIndexOffset={isSelected ? 1000 : 0}
                  eventHandlers={{ click: () => onSelectTeam(team.teamId) }}
                >
                  <Tooltip direction="top" opacity={1}>
                    <div className="text-xs">
                      <strong>{team.fullName}</strong>
                      <br />
                      {team.wins ?? 0}–{team.losses ?? 0} · Win {formatMetric('winPct', team.winPct)}
                      <br />
                      Net {formatMetric('netRtg', team.netRtg)} · Clutch {formatMetric('clutchNetRtg', team.clutchNetRtg)}
                    </div>
                  </Tooltip>
                </Marker>
              )
            })}
          </MapContainer>

          <div className="absolute bottom-4 left-4 z-[500] rounded-lg border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur-sm">
            <p className="mb-2 text-xs font-medium text-gray-700">
              {METRIC_LABELS[metric]}
            </p>
            <div className="space-y-1">
              {stopsFor(metric).map((stop) => (
                <div key={stop.label} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ background: stop.color }} />
                  <span className="text-xs text-gray-600">{stop.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">Click a team marker to view its roster and trends →</p>
      </CardContent>
    </Card>
  )
}
