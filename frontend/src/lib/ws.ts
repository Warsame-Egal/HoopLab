import { logger } from './logger'
import type { BoxScoreResponse, PlayByPlayResponse, ScoreboardResponse } from '../types/scoreboard'

export type ReconnectingWebSocketOptions = {
  maxReconnectAttempts?: number
  baseDelay?: number
  maxDelay?: number
  logLabel?: string
  staleMs?: number
}

export type WsConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting'

export class ReconnectingWebSocket<T> {
  private socket: WebSocket | null = null
  private url: string | null = null
  private listeners = new Set<(data: T) => void>()
  private statusListeners = new Set<(status: WsConnectionStatus) => void>()
  private status: WsConnectionStatus = 'idle'
  private shouldReconnect = true
  private reconnectAttempts = 0
  private pendingClose = false
  private lastMessageAt = 0
  private staleTimer: ReturnType<typeof setInterval> | null = null
  private readonly maxReconnectAttempts: number
  private readonly baseDelay: number
  private readonly maxDelay: number
  private readonly logLabel: string
  private readonly staleMs: number

  constructor(options: ReconnectingWebSocketOptions = {}) {
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10
    this.baseDelay = options.baseDelay ?? 1000
    this.maxDelay = options.maxDelay ?? 30000
    this.logLabel = options.logLabel ?? 'WebSocket'
    this.staleMs = options.staleMs ?? 45_000
  }

  private setStatus(next: WsConnectionStatus): void {
    if (this.status === next) return
    this.status = next
    this.statusListeners.forEach((cb) => cb(next))
  }

  subscribeStatus(callback: (status: WsConnectionStatus) => void): void {
    this.statusListeners.add(callback)
    callback(this.status)
  }

  unsubscribeStatus(callback: (status: WsConnectionStatus) => void): void {
    this.statusListeners.delete(callback)
  }

  get connectionStatus(): WsConnectionStatus {
    return this.status
  }

  private getReconnectDelay(): number {
    const exponential = Math.min(this.baseDelay * 2 ** this.reconnectAttempts, this.maxDelay)
    const jitter = exponential * 0.2 * Math.random()
    return exponential + jitter
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`Max ${this.logLabel} reconnect attempts reached`)
      return
    }
    const delay = this.getReconnectDelay()
    this.reconnectAttempts++
    setTimeout(() => {
      if (this.shouldReconnect && this.url && !this.socket) {
        this.connect(this.url)
      }
    }, delay)
  }

  private startStaleWatch(): void {
    this.stopStaleWatch()
    this.staleTimer = setInterval(() => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return
      if (this.lastMessageAt > 0 && Date.now() - this.lastMessageAt > this.staleMs) {
        this.socket.close(4000, 'stale connection')
      }
    }, 10_000)
  }

  private stopStaleWatch(): void {
    if (this.staleTimer) {
      clearInterval(this.staleTimer)
      this.staleTimer = null
    }
  }

  private safeClose(): void {
    const ws = this.socket
    if (!ws) return
    if (ws.readyState === WebSocket.CONNECTING) {
      this.pendingClose = true
      const onOpen = () => {
        ws.removeEventListener('open', onOpen)
        if (this.pendingClose) ws.close(1000, 'client disconnect')
      }
      ws.addEventListener('open', onOpen)
      return
    }
    ws.close(1000, 'client disconnect')
  }

  connect(url: string): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.url === url) return
    this.pendingClose = false
    if (this.socket) {
      this.safeClose()
      this.socket = null
    }
    this.shouldReconnect = true
    this.url = url
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting')
    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      this.pendingClose = false
      this.lastMessageAt = Date.now()
      this.setStatus('connected')
      this.startStaleWatch()
    }

    this.socket.onmessage = (event) => {
      this.lastMessageAt = Date.now()
      try {
        const data = JSON.parse(event.data) as T
        this.listeners.forEach((callback) => callback(data))
      } catch (error) {
        logger.error(`[${this.logLabel}] Error parsing message:`, error, event.data)
      }
    }

    this.socket.onclose = (event) => {
      this.socket = null
      this.stopStaleWatch()
      if (this.pendingClose) {
        this.pendingClose = false
        this.setStatus('idle')
        return
      }
      if (this.shouldReconnect && this.url && event.code !== 1000) {
        this.setStatus('reconnecting')
        this.scheduleReconnect()
      } else {
        this.setStatus('idle')
      }
    }
  }

  subscribe(callback: (data: T) => void): void {
    this.listeners.add(callback)
  }

  unsubscribe(callback: (data: T) => void): void {
    this.listeners.delete(callback)
  }

  disconnect(): void {
    this.shouldReconnect = false
    this.reconnectAttempts = 0
    this.pendingClose = false
    this.stopStaleWatch()
    this.safeClose()
    this.socket = null
    this.url = null
    this.setStatus('idle')
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}

/** Same host as the page by default (nginx/vite proxy /ws -> Spring). */
export function resolveWsBase(): string {
  const configured = import.meta.env.VITE_WS_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
  }
  return 'ws://localhost:8080'
}

export function scoreboardWebSocketUrl(): string {
  return `${resolveWsBase()}/ws/scoreboard`
}

export function playByPlayWebSocketUrl(gameId: string): string {
  return `${resolveWsBase()}/ws/games/${gameId}/play-by-play`
}

export const scoreboardSocket = new ReconnectingWebSocket<ScoreboardResponse>({
  logLabel: 'Scoreboard WebSocket',
})

type GameLivePayload = PlayByPlayResponse | BoxScoreResponse

function isPlayByPlayPayload(data: GameLivePayload): data is PlayByPlayResponse {
  return Array.isArray((data as PlayByPlayResponse).plays)
}

function isBoxScorePayload(data: GameLivePayload): data is BoxScoreResponse {
  return (data as BoxScoreResponse).home_team != null
}

export const playByPlaySocket = new ReconnectingWebSocket<GameLivePayload>({
  logLabel: 'Game live WebSocket',
})

let scoreboardSubscriberCount = 0
let scoreboardTeardownTimer: ReturnType<typeof setTimeout> | null = null

export function subscribeScoreboard(callback: (data: ScoreboardResponse) => void): void {
  if (scoreboardTeardownTimer) {
    clearTimeout(scoreboardTeardownTimer)
    scoreboardTeardownTimer = null
  }
  scoreboardSubscriberCount++
  scoreboardSocket.subscribe(callback)
  if (scoreboardSubscriberCount === 1) {
    scoreboardSocket.connect(scoreboardWebSocketUrl())
  }
}

export function subscribeScoreboardStatus(callback: (status: WsConnectionStatus) => void): void {
  scoreboardSocket.subscribeStatus(callback)
}

export function unsubscribeScoreboardStatus(callback: (status: WsConnectionStatus) => void): void {
  scoreboardSocket.unsubscribeStatus(callback)
}

export function unsubscribeScoreboard(callback: (data: ScoreboardResponse) => void): void {
  scoreboardSocket.unsubscribe(callback)
  scoreboardSubscriberCount = Math.max(0, scoreboardSubscriberCount - 1)
  if (scoreboardSubscriberCount === 0) {
    scoreboardTeardownTimer = setTimeout(() => {
      if (scoreboardSubscriberCount === 0) scoreboardSocket.disconnect()
      scoreboardTeardownTimer = null
    }, 300)
  }
}

type GameLiveCallbacks = {
  onPbp?: (data: PlayByPlayResponse) => void
  onBoxscore?: (data: BoxScoreResponse) => void
}

const gameLiveRefs = new Map<string, number>()
let activeGameId: string | null = null
let gameTeardownTimer: ReturnType<typeof setTimeout> | null = null

// Dedicated listener sets for typed routing
const pbpListeners = new Set<(data: PlayByPlayResponse) => void>()
const boxListeners = new Set<(data: BoxScoreResponse) => void>()
let gameRouterAttached = false

function attachGameRouter(): void {
  if (gameRouterAttached) return
  gameRouterAttached = true
  playByPlaySocket.subscribe((data) => {
    if (isPlayByPlayPayload(data)) {
      pbpListeners.forEach((cb) => cb(data))
    } else if (isBoxScorePayload(data)) {
      boxListeners.forEach((cb) => cb(data))
    }
  })
}

export function subscribeGameLive(gameId: string, callbacks: GameLiveCallbacks): void {
  attachGameRouter()
  if (gameTeardownTimer) {
    clearTimeout(gameTeardownTimer)
    gameTeardownTimer = null
  }

  if (callbacks.onPbp) pbpListeners.add(callbacks.onPbp)
  if (callbacks.onBoxscore) boxListeners.add(callbacks.onBoxscore)

  const count = (gameLiveRefs.get(gameId) ?? 0) + 1
  gameLiveRefs.set(gameId, count)

  if (activeGameId !== gameId) {
    playByPlaySocket.disconnect()
    activeGameId = gameId
    playByPlaySocket.connect(playByPlayWebSocketUrl(gameId))
  } else if (!playByPlaySocket.isConnected && count === 1) {
    playByPlaySocket.connect(playByPlayWebSocketUrl(gameId))
  }
}

export function unsubscribeGameLive(gameId: string, callbacks: GameLiveCallbacks): void {
  if (callbacks.onPbp) pbpListeners.delete(callbacks.onPbp)
  if (callbacks.onBoxscore) boxListeners.delete(callbacks.onBoxscore)

  const count = Math.max(0, (gameLiveRefs.get(gameId) ?? 1) - 1)
  if (count === 0) {
    gameLiveRefs.delete(gameId)
  } else {
    gameLiveRefs.set(gameId, count)
  }

  const anyGameSubs = gameLiveRefs.size > 0
  if (!anyGameSubs) {
    gameTeardownTimer = setTimeout(() => {
      if (gameLiveRefs.size === 0) {
        playByPlaySocket.disconnect()
        activeGameId = null
      }
      gameTeardownTimer = null
    }, 300)
  }
}
