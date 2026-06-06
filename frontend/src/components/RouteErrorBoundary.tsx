import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '../lib/logger'

type Props = { children: ReactNode }
type State = { error: Error | null }

function isChunkLoadError(error: Error): boolean {
  const msg = error.message.toLowerCase()
  return msg.includes('dynamically imported module') || msg.includes('loading chunk') || msg.includes('failed to fetch')
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Route error:', error, info.componentStack)
  }

  handleTryAgain = (): void => {
    const { error } = this.state
    if (error && isChunkLoadError(error)) {
      window.location.reload()
      return
    }
    this.setState({ error: null })
  }

  handleHome = (): void => {
    window.location.assign('/')
  }

  render() {
    if (this.state.error) {
      const chunkError = isChunkLoadError(this.state.error)
      return (
        <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
          <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={this.handleTryAgain}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
            >
              {chunkError ? 'Reload page' : 'Try again'}
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
            >
              Home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
