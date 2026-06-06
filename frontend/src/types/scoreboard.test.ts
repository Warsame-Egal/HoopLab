import { describe, expect, it } from 'vitest'
import { getGameStatus, isClutchGame, type Game } from './scoreboard'

const baseGame: Game = {
  gameId: '0022500001',
  gameStatus: 1,
  gameStatusText: 'Scheduled',
  period: 0,
  gameClock: null,
  gameTimeUTC: '2025-01-01T00:00:00Z',
  homeTeam: {
    teamId: 1,
    teamName: 'Home',
    teamCity: 'City',
    teamTricode: 'HOM',
    wins: 0,
    losses: 0,
    score: 0,
  },
  awayTeam: {
    teamId: 2,
    teamName: 'Away',
    teamCity: 'City',
    teamTricode: 'AWY',
    wins: 0,
    losses: 0,
    score: 0,
  },
  gameLeaders: null,
}

describe('getGameStatus', () => {
  it('returns live for in-progress status', () => {
    expect(getGameStatus({ ...baseGame, gameStatus: 2 })).toBe('live')
  })

  it('returns completed for final status', () => {
    expect(getGameStatus({ ...baseGame, gameStatus: 3, gameStatusText: 'Final' })).toBe('completed')
  })

  it('returns upcoming for scheduled status', () => {
    expect(getGameStatus({ ...baseGame, gameStatus: 1, gameStatusText: '7:00 pm ET' })).toBe('upcoming')
  })

  it('returns live when status is 1 but period and scores indicate in progress', () => {
    expect(
      getGameStatus({
        ...baseGame,
        gameStatus: 1,
        gameStatusText: 'Q3 4:32',
        period: 3,
        homeTeam: { ...baseGame.homeTeam, score: 88 },
        awayTeam: { ...baseGame.awayTeam, score: 85 },
      }),
    ).toBe('live')
  })

  it('returns live for halftime with scheduled status id', () => {
    expect(
      getGameStatus({
        ...baseGame,
        gameStatus: 1,
        gameStatusText: 'Halftime',
        period: 2,
        homeTeam: { ...baseGame.homeTeam, score: 52 },
        awayTeam: { ...baseGame.awayTeam, score: 48 },
      }),
    ).toBe('live')
  })
})

describe('isClutchGame', () => {
  it('detects close Q4 games', () => {
    const game: Game = {
      ...baseGame,
      gameStatus: 2,
      period: 4,
      gameClock: '4:12',
      homeTeam: { ...baseGame.homeTeam, score: 102 },
      awayTeam: { ...baseGame.awayTeam, score: 100 },
    }
    expect(isClutchGame(game)).toBe(true)
  })

  it('rejects blowouts', () => {
    const game: Game = {
      ...baseGame,
      gameStatus: 2,
      period: 4,
      gameClock: '2:00',
      homeTeam: { ...baseGame.homeTeam, score: 120 },
      awayTeam: { ...baseGame.awayTeam, score: 100 },
    }
    expect(isClutchGame(game)).toBe(false)
  })
})
