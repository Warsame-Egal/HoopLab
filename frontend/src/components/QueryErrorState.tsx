import { RefreshCw } from 'lucide-react'

export function QueryErrorState({
  message = 'Could not load data.',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      ) : null}
    </div>
  )
}
