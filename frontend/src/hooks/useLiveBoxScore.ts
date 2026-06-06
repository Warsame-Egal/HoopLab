import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { subscribeGameLive, unsubscribeGameLive } from '../lib/ws'
import type { BoxScoreResponse } from '../types/scoreboard'

export function useLiveBoxScore(gameId: string | undefined, live: boolean) {
  const [liveData, setLiveData] = useState<BoxScoreResponse | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['liveBoxscore', gameId],
    queryFn: () => api<BoxScoreResponse>(`/api/games/${gameId}/live-boxscore`),
    enabled: !!gameId && live,
    staleTime: 5_000,
  })

  useEffect(() => {
    if (!gameId || !live) return

    const onBoxscore = (payload: BoxScoreResponse) => {
      if (payload?.home_team) setLiveData(payload)
    }

    subscribeGameLive(gameId, { onBoxscore })

    return () => unsubscribeGameLive(gameId, { onBoxscore })
  }, [gameId, live])

  const boxscore = live && liveData ? liveData : data

  return {
    data: boxscore,
    isLoading: isLoading && !boxscore,
    isError,
    refetch,
  }
}
