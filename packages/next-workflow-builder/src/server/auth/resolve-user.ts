import { auth } from './index'
import { getAuthConfig } from './config-store'

/**
 * Normalized user object returned by resolveUser().
 * Package only needs `id` for ownership checks; email and name are optional metadata.
 */
export type ResolvedUser = {
  id: string
  email?: string
  name?: string
} | null

/**
 * Centralized auth check — ALL route handlers call this instead of auth.api.getSession().
 *
 * Delegates to the custom getUser resolver if one was provided via config,
 * otherwise falls back to better-auth session lookup.
 *
 * @param request - The incoming Next.js Request object
 * @returns User object or null for unauthenticated requests
 */
export async function resolveUser(request: Request): Promise<ResolvedUser> {
  const config = getAuthConfig()

  // Custom resolver takes priority — consumer's own auth system
  if (config.getUser) {
    return config.getUser(request)
  }

  // Default: use better-auth session
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) return null

  return {
    id: session.user.id,
    email: session.user.email ?? undefined,
    name: session.user.name ?? undefined,
  }
}
