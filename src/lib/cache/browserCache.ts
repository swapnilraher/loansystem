"use client"

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const memoryFallback = new Map<string, CacheEntry<any>>()

const DEFAULT_TTL_MS = 3 * 60 * 1000 // 3 minutes

export function getBrowserCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.sessionStorage.getItem(`cache_${key}`)
    if (!raw) return null

    const entry: CacheEntry<T> = JSON.parse(raw)
    const now = Date.now()

    if (now - entry.timestamp > entry.ttl) {
      window.sessionStorage.removeItem(`cache_${key}`)
      return null
    }

    return entry.data
  } catch {
    const entry = memoryFallback.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > entry.ttl) {
      memoryFallback.delete(key)
      return null
    }
    return entry.data
  }
}

export function setBrowserCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  if (typeof window === "undefined") return

  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  }

  try {
    window.sessionStorage.setItem(`cache_${key}`, JSON.stringify(entry))
  } catch {
    memoryFallback.set(key, entry)
  }
}

export function invalidateBrowserCache(pattern?: string): void {
  if (typeof window === "undefined") return

  try {
    if (!pattern) {
      // Clear all cache keys
      const keysToRemove: string[] = []
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i)
        if (k && k.startsWith("cache_")) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k))
      memoryFallback.clear()
      return
    }

    const keysToRemove: string[] = []
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i)
      if (k && k.startsWith(`cache_${pattern}`)) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => window.sessionStorage.removeItem(k))

    for (const k of memoryFallback.keys()) {
      if (k.startsWith(pattern)) {
        memoryFallback.delete(k)
      }
    }
  } catch {
    memoryFallback.clear()
  }
}
