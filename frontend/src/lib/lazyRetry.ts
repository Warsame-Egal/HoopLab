import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

type ModuleDefault<T> = { default: T }

/**
 * Lazy-load with retry for stale chunk hashes after deploys.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<ModuleDefault<T>>,
): LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch(() =>
      factory().catch(() => {
        window.location.reload()
        return new Promise<ModuleDefault<T>>(() => {})
      }),
    ),
  )
}
