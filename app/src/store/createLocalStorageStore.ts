import { useCallback, useSyncExternalStore } from 'react'

/**
 * A localStorage-backed store shared across every component that uses it, via useSyncExternalStore
 * — as opposed to each call site running its own independent `useState`, which desyncs the moment
 * two components using the "same" store are mounted at once (one updates its own copy, the other
 * never re-renders because it never subscribed to that copy — this is exactly the bug that made
 * hiding a player not update the pool grid in the same render: usePlayerPool() and the page's own
 * remove button each held a separate useHiddenPlayers() instance).
 */
export function createLocalStorageStore<T>(key: string, defaultValue: T) {
  function load(): T {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : defaultValue
    } catch {
      return defaultValue
    }
  }

  let current = load()
  const listeners = new Set<() => void>()

  function set(updater: T | ((prev: T) => T)): void {
    const next = typeof updater === 'function' ? (updater as (prev: T) => T)(current) : updater
    current = next
    localStorage.setItem(key, JSON.stringify(current))
    listeners.forEach((listener) => listener())
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function getSnapshot(): T {
    return current
  }

  function useStore(): [T, (updater: T | ((prev: T) => T)) => void] {
    const value = useSyncExternalStore(subscribe, getSnapshot)
    return [value, useCallback(set, [])]
  }

  return { useStore }
}
