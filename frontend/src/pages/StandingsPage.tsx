import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TeamLogo } from '../components/TeamLogo'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { StatTable, type StatColumn } from '../components/ui/StatTable'
import { api, type StandingRow } from '../lib/api'
import { parseClinchStatus, STANDINGS_STATUS_LEGEND } from '../lib/standingsStatus'
import { cn } from '../lib/utils'
import { useSeason } from '../lib/useSeason'

const PLAY_IN_RANK = 10

function standingColumns(): StatColumn<StandingRow>[] {
  return [
    { key: 'confRank', header: '#', align: 'right', numeric: true, render: (r) => r.confRank ?? '—' },
    {
      key: 'abbreviation',
      header: 'Team',
      render: (r) => {
        const status = parseClinchStatus(r.clinch)
        return (
          <Link to={`/teams/${r.teamId}`} className="flex items-center gap-2 font-medium text-foreground hover:text-brand">
            <TeamLogo abbreviation={r.abbreviation} teamId={r.teamId} className="h-6 w-6" />
            <span>{r.fullName}</span>
            {status ? <Badge variant={status.variant}>{status.label}</Badge> : null}
          </Link>
        )
      },
    },
    { key: 'wins', header: 'W', align: 'right', numeric: true, render: (r) => r.wins ?? '—' },
    { key: 'losses', header: 'L', align: 'right', numeric: true, render: (r) => r.losses ?? '—' },
    {
      key: 'winPct',
      header: 'PCT',
      align: 'right',
      numeric: true,
      render: (r) => (r.winPct == null ? '—' : r.winPct.toFixed(3).replace(/^0/, '')),
    },
    {
      key: 'gamesBack',
      header: 'GB',
      align: 'right',
      numeric: true,
      render: (r) => (r.gamesBack == null || r.gamesBack === 0 ? '—' : r.gamesBack.toFixed(1)),
    },
    { key: 'lastTen', header: 'L10', align: 'center', render: (r) => r.lastTen ?? '—' },
    {
      key: 'streak',
      header: 'STRK',
      align: 'center',
      render: (r) => (
        <Badge
          variant={r.streak?.startsWith('W') ? 'success' : r.streak?.startsWith('L') ? 'live' : 'default'}
          className="tabular-nums"
        >
          {r.streak ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'netRtg',
      header: 'NET',
      align: 'right',
      numeric: true,
      render: (r) => (
        <span className={cn('tabular-nums', (r.netRtg ?? 0) >= 0 ? 'text-success' : 'text-live')}>
          {r.netRtg == null ? '—' : r.netRtg.toFixed(1)}
        </span>
      ),
    },
  ]
}

function ConferenceTable({ title, rows }: { title: string; rows: StandingRow[] }) {
  const cols = standingColumns()
  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-2">
        <StatTable
          columns={cols}
          rows={rows}
          getRowKey={(r) => r.teamId}
          emptyTitle="No standings"
          emptyDescription="Standings unavailable for this season."
        />
        {rows.some((r) => (r.confRank ?? 99) === PLAY_IN_RANK) ? (
          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            — Play-in cutoff (rank {PLAY_IN_RANK})
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function StandingsPage() {
  const { season } = useSeason()

  const { data, isLoading } = useQuery({
    queryKey: ['standings', season],
    queryFn: () => api<StandingRow[]>(`/api/standings?season=${season}`),
  })

  const rows = data ?? []
  const east = rows.filter((r) => r.conference === 'East').sort((a, b) => (a.confRank ?? 99) - (b.confRank ?? 99))
  const west = rows.filter((r) => r.conference === 'West').sort((a, b) => (a.confRank ?? 99) - (b.confRank ?? 99))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Standings</h2>
        <p className="text-sm text-muted-foreground">
          <span className="text-muted-foreground">{season}</span> · Conference rankings, streaks & net rating
        </p>
      </div>
      {isLoading ? (
        <StatTable columns={[{ key: 'x', header: '…' }]} rows={[]} getRowKey={() => 'x'} loading />
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">No standings for {season}.</p>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <ConferenceTable title="Eastern Conference" rows={east} />
            <ConferenceTable title="Western Conference" rows={west} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Status:</span>
            {STANDINGS_STATUS_LEGEND.map((item) => (
              <Badge key={item.label} variant={item.variant}>
                {item.label}
              </Badge>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
