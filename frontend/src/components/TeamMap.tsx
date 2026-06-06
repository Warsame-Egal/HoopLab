import { useEffect, useMemo, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Map as MapIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { teamLogoUrl } from '../lib/teamLogo'
import { TeamLogo } from './TeamLogo'
import { cn } from '../lib/utils'
import { useTheme } from '../lib/useTheme'
import type { TeamMapPoint } from '../lib/api'
import type { Game } from '../types/scoreboard'
import { getGameStatus } from '../types/scoreboard'
import { teamWinPct } from '../lib/teamWinPct'
import 'leaflet/dist/leaflet.css'

export type MapMetric = 'winPct' | 'netRtg' | 'clutchNetRtg'

const US_CENTER: [number, number] = [39.8, -98.5]
const MAP_BOUNDS = L.latLngBounds([24, -125], [50, -66])

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

const WIN_PCT_STOPS = [
  { min: 60, color: 'var(--success)', label: '> 60%' },
  { min: 50, color: 'var(--brand)', label: '50–60%' },
  { min: 40, color: 'var(--warning)', label: '40–50%' },
  { min: 30, color: 'var(--muted-foreground)', label: '30–40%' },
  { min: -Infinity, color: 'var(--live)', label: '< 30%' },
]

function stopsFor(metric: MapMetric) {
  if (metric === 'winPct') return WIN_PCT_STOPS
  if (metric === 'clutchNetRtg') return CLUTCH_STOPS
  return NET_RTG_STOPS
}

function colorFor(metric: MapMetric, value: number | null): string {
  if (value == null) return 'var(--muted-foreground)'
  for (const stop of stopsFor(metric)) {
    if (value >= stop.min) return stop.color
  }
  return 'var(--muted-foreground)'
}

function metricValue(metric: MapMetric, team: TeamMapPoint): number | null {
  if (metric === 'winPct') return teamWinPct(team)
  if (metric === 'clutchNetRtg') return team.clutchNetRtg
  return team.netRtg
}

function formatMetric(metric: MapMetric, value: number | null): string {
  if (value == null) return '—'
  if (metric === 'winPct') return `${value.toFixed(1)}%`
  return value.toFixed(1)
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
  const size = isSelected ? 44 : 32
  const border = isSelected ? 3 : 2
  const pulse = isSelected
    ? 'box-shadow:0 0 0 4px rgba(234,88,12,0.35), 0 2px 8px rgba(0,0,0,0.25);'
    : 'box-shadow:0 2px 6px rgba(0,0,0,0.2);'
  const url = teamLogoUrl(team.abbreviation)
  const inner = url
    ? `<img src="${url}" alt="${team.abbreviation}" style="width:72%;height:72%;object-fit:contain;" onerror="this.style.display='none'"/>`
    : `<span style="font-size:10px;font-weight:600;color:#525252;">${team.abbreviation}</span>`
  const html = `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#fff;border:${border}px solid ${ringColor};${pulse}display:flex;align-items:center;justify-content:center;overflow:hidden;transition:transform 0.15s ease;">${inner}</div>`
  return L.divIcon({
    html,
    className: 'team-logo-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    tooltipAnchor: [0, -size / 2],
  })
}

function curvedLine(away: [number, number], home: [number, number], steps = 12): [number, number][] {
  const midLat = (away[0] + home[0]) / 2
  const midLng = (away[1] + home[1]) / 2
  const ctrlLat = midLat + 2.5
  const ctrlLng = midLng
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const lat = (1 - t) * (1 - t) * away[0] + 2 * (1 - t) * t * ctrlLat + t * t * home[0]
    const lng = (1 - t) * (1 - t) * away[1] + 2 * (1 - t) * t * ctrlLng + t * t * home[1]
    pts.push([lat, lng])
  }
  return pts
}

function edgeStyle(status: ReturnType<typeof getGameStatus>): { color: string; weight: number; dashArray?: string; opacity: number } {
  if (status === 'live') return { color: '#ea580c', weight: 4, dashArray: '8 12', opacity: 0.95 }
  if (status === 'upcoming') return { color: '#737373', weight: 2, dashArray: '6 8', opacity: 0.6 }
  return { color: '#a3a3a3', weight: 2, opacity: 0.5 }
}

const DEFAULT_ZOOM_OFFSET = 1

/** Initial bounds fit only — avoids resetting zoom on every parent re-render. */
function FitToTeams({ points }: { points: [number, number][] }) {
  const map = useMap()
  const lastFitKey = useRef('')
  useEffect(() => {
    if (points.length === 0) return
    const key = String(points.length)
    if (lastFitKey.current === key) return
    lastFitKey.current = key
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 6 })
    const id = window.setTimeout(() => {
      const next = Math.min(map.getZoom() + DEFAULT_ZOOM_OFFSET, map.getMaxZoom())
      map.setZoom(next)
    }, 0)
    return () => window.clearTimeout(id)
  }, [map, points])
  return null
}

const MAP_HEIGHT = 'clamp(540px, 72vh, 920px)'

/** Keep wheel events on the map — no page scroll or browser zoom. */
function MapWheelCapture() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const onWheel = (e: WheelEvent) => {
      e.stopPropagation()
      e.preventDefault()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [map])
  return null
}

type TeamMapProps = {
  teams: TeamMapPoint[]
  metric: MapMetric
  selectedTeamId: number | null
  onSelectTeam: (teamId: number) => void
  matchupGames?: Game[]
  defaultShowMatchups?: boolean
}

export function TeamMap({
  teams,
  metric,
  selectedTeamId,
  onSelectTeam,
  matchupGames = [],
  defaultShowMatchups = true,
}: TeamMapProps) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const listId = useId()
  const [showMatchups, setShowMatchups] = useState(defaultShowMatchups && matchupGames.length > 0)
  const plotted = useMemo(
    () => teams.filter((t) => t.latitude != null && t.longitude != null),
    [teams],
  )
  const sortedForList = useMemo(
    () => [...plotted].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [plotted],
  )
  const points = useMemo(
    () => plotted.map((t) => [t.latitude as number, t.longitude as number] as [number, number]),
    [plotted],
  )

  const teamById = useMemo(() => new Map(plotted.map((t) => [t.teamId, t])), [plotted])

  const matchupEdges = useMemo(() => {
    if (!showMatchups) return []
    return matchupGames
      .map((game) => {
        const away = teamById.get(game.awayTeam.teamId)
        const home = teamById.get(game.homeTeam.teamId)
        if (!away?.latitude || !away.longitude || !home?.latitude || !home.longitude) return null
        const awayPos: [number, number] = [away.latitude, away.longitude]
        const homePos: [number, number] = [home.latitude, home.longitude]
        return {
          game,
          positions: curvedLine(awayPos, homePos),
          status: getGameStatus(game),
          label: `${game.awayTeam.teamTricode} ${game.awayTeam.score ?? '–'} @ ${game.homeTeam.teamTricode} ${game.homeTeam.score ?? '–'} · ${game.gameStatusText}`,
        }
      })
      .filter((e): e is NonNullable<typeof e> => e != null)
  }, [matchupGames, showMatchups, teamById])

  const tileUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'

  return (
    <Card className="card-hover h-full">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <MapIcon className="h-5 w-5 text-success" aria-hidden />
          {METRIC_TITLES[metric]}
        </CardTitle>
        {matchupGames.length > 0 ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showMatchups}
              onChange={(e) => setShowMatchups(e.target.checked)}
              className="rounded border-border"
            />
            Today&apos;s matchups
          </label>
        ) : null}
      </CardHeader>
      <CardContent className="pt-4">
        <div
          className="team-map-viewport relative"
          role="region"
          aria-label={METRIC_TITLES[metric]}
          onWheel={(e) => e.stopPropagation()}
        >
          <MapContainer
            center={US_CENTER}
            zoom={5}
            minZoom={3}
            maxZoom={10}
            maxBounds={MAP_BOUNDS}
            maxBoundsViscosity={0.85}
            style={{ height: MAP_HEIGHT, width: '100%', borderRadius: 'var(--radius-lg)' }}
            scrollWheelZoom
            zoomControl
          >
            <TileLayer url={tileUrl} attribution="&copy; OpenStreetMap, &copy; CARTO" />
            <MapWheelCapture />
            <FitToTeams points={points} />
            {matchupEdges.map(({ game, positions, status, label }) => {
              const style = edgeStyle(status)
              const highlighted =
                selectedTeamId != null &&
                (game.homeTeam.teamId === selectedTeamId || game.awayTeam.teamId === selectedTeamId)
              return (
                <Polyline
                  key={game.gameId}
                  positions={positions}
                  pathOptions={{
                    ...style,
                    weight: highlighted ? style.weight + 2 : style.weight,
                  }}
                  eventHandlers={{
                    click: () => navigate(`/games/${game.gameId}`),
                  }}
                >
                  <Tooltip sticky>
                    <Link to={`/games/${game.gameId}`} className="text-xs text-foreground hover:text-brand">
                      {label}
                    </Link>
                  </Tooltip>
                </Polyline>
              )
            })}
            {plotted.map((team) => {
              const value = metricValue(metric, team)
              const isSelected = team.teamId === selectedTeamId
              const ringColor = isSelected ? 'var(--brand)' : colorFor(metric, value)
              return (
                <Marker
                  key={team.teamId}
                  position={[team.latitude as number, team.longitude as number]}
                  icon={logoIcon(team, ringColor, isSelected)}
                  zIndexOffset={isSelected ? 1000 : 0}
                  eventHandlers={{ click: () => onSelectTeam(team.teamId) }}
                >
                  <Tooltip direction="top" opacity={1}>
                    <div className="text-xs text-foreground">
                      <strong>{team.fullName}</strong>
                      <br />
                      {team.wins ?? 0}–{team.losses ?? 0}
                      <br />
                      {METRIC_LABELS[metric]} {formatMetric(metric, value)}
                    </div>
                  </Tooltip>
                </Marker>
              )
            })}
          </MapContainer>

          <div className="absolute bottom-4 left-4 z-[500] rounded-lg border border-border bg-card/95 p-3 shadow-sm backdrop-blur-sm">
            <p className="mb-2 text-xs font-medium text-foreground">{METRIC_LABELS[metric]}</p>
            <div className="space-y-1">
              {stopsFor(metric).map((stop) => (
                <div key={stop.label} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ background: stop.color }} />
                  <span className="text-xs text-muted-foreground">{stop.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Click a team marker to view roster and trends, or use the team list below for keyboard access.
        </p>
        <TeamMapPicker
          teams={sortedForList}
          metric={metric}
          selectedTeamId={selectedTeamId}
          onSelectTeam={onSelectTeam}
          listId={listId}
        />
      </CardContent>
    </Card>
  )
}

function TeamMapPicker({
  teams,
  metric,
  selectedTeamId,
  onSelectTeam,
  listId,
}: {
  teams: TeamMapPoint[]
  metric: MapMetric
  selectedTeamId: number | null
  onSelectTeam: (id: number) => void
  listId: string
}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return teams
    return teams.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        t.abbreviation.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q),
    )
  }, [teams, query])

  return (
    <div className="mt-3 rounded-lg border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${teams.length} teams…`}
          aria-controls={listId}
          className="w-full rounded-md border border-border bg-muted px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <ul id={listId} className="max-h-52 overflow-y-auto p-1" aria-label="Teams on map">
        {filtered.map((team) => {
          const value = metricValue(metric, team)
          const isSelected = team.teamId === selectedTeamId
          return (
            <li key={team.teamId}>
              <button
                type="button"
                onClick={() => onSelectTeam(team.teamId)}
                aria-pressed={isSelected}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected && 'bg-brand/10 ring-1 ring-brand/30',
                )}
              >
                <TeamLogo abbreviation={team.abbreviation} teamId={team.teamId} className="h-6 w-6 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{team.fullName}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatMetric(metric, value)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
