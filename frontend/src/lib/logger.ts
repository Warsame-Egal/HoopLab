/**
 * Tiny logging shim so the few legitimate error logs in the app go through one place and can be
 * silenced in production. Only errors are emitted; there is no debug/info logging in shipped code.
 */
const enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true'

export const logger = {
  error(...args: unknown[]): void {
    if (enabled) {
      console.error(...args)
    }
  },
}
