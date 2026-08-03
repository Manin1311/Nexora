/**
 * Nexora Client-Side Cache
 * 
 * Implements a stale-while-revalidate strategy:
 * - On first visit: fetch from server, cache result
 * - On subsequent visits: return cached data INSTANTLY, then refresh in background
 * - Cache expires after TTL (default 90s) so data stays fresh
 * 
 * This eliminates repeated loading spinners when navigating between pages.
 */

const cache = new Map()

// Default TTL per endpoint type (milliseconds)
const TTL_MAP = {
  '/progress/':       120_000,  // 2 min  — scores don't change constantly
  '/users/me/':       300_000,  // 5 min  — profile rarely changes
  '/users/resume/':   120_000,  // 2 min
  '/roadmap/':        120_000,  // 2 min
  '/challenges/':      60_000,  // 1 min
  '/showcase/':        60_000,  // 1 min
  '/peer-reviews/':    30_000,  // 30s    — more dynamic
  '/notifications/':   30_000,  // 30s
  '/mentor/':          30_000,  // 30s    — conversations list
  DEFAULT:             60_000,  // 1 min  — fallback
}

function getTTL(url = '') {
  for (const [pattern, ttl] of Object.entries(TTL_MAP)) {
    if (pattern !== 'DEFAULT' && url.includes(pattern)) return ttl
  }
  return TTL_MAP.DEFAULT
}

function cacheKey(url, params) {
  return url + (params ? JSON.stringify(params) : '')
}

/** Save a response into cache */
export function cacheSet(url, params, data) {
  const key = cacheKey(url, params)
  cache.set(key, { data, ts: Date.now(), ttl: getTTL(url) })
}

/** Get cached data. Returns { data, stale } or null if not cached. */
export function cacheGet(url, params) {
  const key = cacheKey(url, params)
  const entry = cache.get(key)
  if (!entry) return null
  const stale = Date.now() - entry.ts > entry.ttl
  return { data: entry.data, stale }
}

/** Invalidate a specific URL pattern (e.g. after a POST/PUT) */
export function cacheInvalidate(urlPattern) {
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) cache.delete(key)
  }
}

/** Clear the entire cache (on logout) */
export function cacheClear() {
  cache.clear()
}
