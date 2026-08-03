import { useState, useEffect, useRef } from 'react'
import { cacheGet, cacheSet } from '@/services/cache'

/**
 * useCachedFetch — stale-while-revalidate hook
 * 
 * Returns cached data immediately (no spinner on repeat visits),
 * then silently refreshes in the background after TTL expires.
 *
 * Usage:
 *   const { data, loading } = useCachedFetch('progress-summary', () => progressService.getSummary())
 *
 * @param {string}   key         - Unique cache key for this data
 * @param {Function} fetchFn     - Async function that returns { data: ... }
 * @param {any}      defaultVal  - Default value before any data arrives ([], null, etc.)
 */
export function useCachedFetch(key, fetchFn, defaultVal = null) {
  const cached = cacheGet(key, null)
  const [data, setData]       = useState(cached ? cached.data : defaultVal)
  const [loading, setLoading] = useState(!cached)  // no spinner if we have cache
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const run = async (silent = false) => {
      try {
        const res = await fetchFn()
        const result = res?.data !== undefined ? res.data : res
        cacheSet(key, null, result)
        setData(result)
      } catch (e) {
        // silently keep showing cached data on error
      } finally {
        if (!silent) setLoading(false)
      }
    }

    if (!cached) {
      // No cache — show spinner until data arrives
      run(false)
    } else if (cached.stale) {
      // Stale cache — show cached immediately, refresh silently
      setLoading(false)
      run(true)
    } else {
      // Fresh cache — no fetch needed
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, setData }
}
