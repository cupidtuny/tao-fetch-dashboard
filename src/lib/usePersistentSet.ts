import { useCallback, useSyncExternalStore } from "react";

/**
 * A Set<number> backed by localStorage, used to remember favorited and hidden
 * subnets across sessions.
 *
 * Built on useSyncExternalStore so it is SSR-safe (the server snapshot is an
 * empty set; the client re-syncs from localStorage after hydration) without
 * calling setState inside an effect.
 */

const EMPTY: Set<number> = new Set();
const STORAGE_EVENT = "tao-dashboard-storage";

// Per-key cache so getSnapshot returns a stable reference while unchanged
// (useSyncExternalStore compares snapshots with Object.is).
const cache = new Map<string, { raw: string | null; value: Set<number> }>();

function read(key: string): Set<number> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value;

  let value: Set<number>;
  try {
    value = new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    value = new Set();
  }
  cache.set(key, { raw, value });
  return value;
}

function subscribe(callback: () => void) {
  // 'storage' fires for other tabs; our custom event fires for this tab.
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

export function usePersistentSet(key: string) {
  const set = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY,
  );

  const toggle = useCallback(
    (id: number) => {
      const next = new Set(read(key));
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const raw = JSON.stringify([...next]);
      try {
        localStorage.setItem(key, raw);
      } catch {
        // Storage full or unavailable — keep the in-memory value anyway.
      }
      cache.set(key, { raw, value: next });
      window.dispatchEvent(new Event(STORAGE_EVENT));
    },
    [key],
  );

  const has = useCallback((id: number) => set.has(id), [set]);

  return { set, has, toggle };
}
