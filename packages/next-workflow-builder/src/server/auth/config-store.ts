/**
 * Auth config store — module-level singleton for auth configuration.
 *
 * Provider list is read from process.env.WFB_AUTH_PROVIDERS (set by withWorkflowBuilder).
 * getUser resolver is pulled from the next/ entry module via getPendingGetUser().
 */

export type GetUserFn = (req: Request) => Promise<{ id: string; email?: string; name?: string } | null>

export interface WfbAuthConfig {
  providers: string[]
  getUser?: GetUserFn
}

let _customGetUser: GetUserFn | undefined
let _initialized = false

/**
 * Set custom getUser resolver. Can be called directly by consumers who need to set
 * the resolver at server initialization time (e.g., in a custom server entry point).
 */
export function setGetUserResolver(fn: GetUserFn) {
  _customGetUser = fn
}

/**
 * One-time initialization: pull the getUser function from the next/ entry module
 * where withWorkflowBuilder() stored it. This bridges the CJS build-time context
 * to the server runtime context safely.
 */
function initializeFromPending() {
  if (_initialized) return
  _initialized = true

  try {
    // Import from the package's own next entry (same module that withWorkflowBuilder wrote to)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPendingGetUser } = require('workflow-builder/next') as { getPendingGetUser?: () => GetUserFn | undefined }
    const pending = getPendingGetUser?.()
    if (pending && !_customGetUser) {
      _customGetUser = pending
    }
  } catch {
    // next entry not available (e.g., during tests) — getUser can still be set via setGetUserResolver()
  }
}

/**
 * Get the current auth configuration.
 * Reads provider list from env var (set by withWorkflowBuilder).
 * Pulls getUser resolver from next/ entry module on first call.
 */
export function getAuthConfig(): WfbAuthConfig {
  initializeFromPending()

  const providersEnv = process.env.WFB_AUTH_PROVIDERS || ''
  const providers = providersEnv ? providersEnv.split(',').map(p => p.trim()).filter(Boolean) : []

  return {
    providers,
    getUser: _customGetUser,
  }
}

/**
 * Check if a custom getUser resolver has been configured.
 */
export function hasCustomGetUser(): boolean {
  initializeFromPending()
  return _customGetUser !== undefined
}
