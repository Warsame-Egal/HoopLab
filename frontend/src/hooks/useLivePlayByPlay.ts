import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { subscribeGameLive, unsubscribeGameLive } from '../lib/ws'
import type { PlayByPlayEvent, PlayByPlayResponse } from '../types/scoreboard'

function sortNewestFirst(plays: PlayByPlayEvent[]): PlayByPlayEvent[] {
  return [...plays].sort((a, b) => b.action_number - a.action_number)
}

export function useLivePlayByPlay(gameId: string | undefined, live = true) {
  const [livePlays, setLivePlays] = useState<PlayByPlayEvent[] | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['playByPlay', gameId],
    queryFn: () => api<PlayByPlayResponse>(`/api/games/${gameId}/play-by-play`),
    enabled: !!gameId,
    staleTime: live ? 0 : 5_000,
    refetchInterval: live ? 3_000 : false,
  })

  const plays = useMemo(() => {
    if (live && livePlays != null) return livePlays
    return sortNewestFirst(data?.plays ?? [])
  }, [live, livePlays, data?.plays])

  useEffect(() => {
    if (!gameId || !live) return

    const onPbp = (payload: PlayByPlayResponse) => {
      if (!payload?.plays?.length) return
      setLivePlays(sortNewestFirst(payload.plays))
    }

    subscribeGameLive(gameId, { onPbp })

    return () => unsubscribeGameLive(gameId, { onPbp })
  }, [gameId, live])

  const loading = isLoading && plays.length === 0

  return { plays, isLoading: loading, isError, refetch }
}
