import { describe, expect, it, vi } from 'vitest'
import { playByPlayWebSocketUrl, resolveWsBase, scoreboardWebSocketUrl } from './ws'

describe('websocket urls', () => {
  it('builds scoreboard websocket path', () => {
    vi.stubEnv('VITE_WS_URL', 'ws://localhost:8080')
    expect(scoreboardWebSocketUrl()).toBe('ws://localhost:8080/ws/scoreboard')
  })

  it('builds play-by-play websocket path with game id', () => {
    vi.stubEnv('VITE_WS_URL', 'ws://localhost:8080')
    expect(playByPlayWebSocketUrl('0022500001')).toBe(
      'ws://localhost:8080/ws/games/0022500001/play-by-play',
    )
  })

  it('uses page host when VITE_WS_URL is unset', () => {
    vi.stubEnv('VITE_WS_URL', '')
    vi.stubGlobal('window', {
      location: { protocol: 'http:', host: 'localhost:5173' },
    } as Window & typeof globalThis)
    expect(resolveWsBase()).toBe('ws://localhost:5173')
  })
})