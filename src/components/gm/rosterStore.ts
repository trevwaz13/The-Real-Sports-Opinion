import { STORAGE_KEY } from "./roster";

// The saved lineup lives in localStorage, which is external state: reads go
// through useSyncExternalStore so the server renders an empty roster and the
// client swaps in the saved one after hydration without a cascading effect.

export type Roster = Record<string, string>; // slot id -> player id

const EMPTY: Roster = {};
const CHANGE_EVENT = "rso-gm-roster-change";

let cache: Roster = EMPTY;
let cacheRaw: string | null = null;

export function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Parsed roster, memoised so repeat reads return a stable reference. */
export function getSnapshot(): Roster {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    cache = raw ? (JSON.parse(raw) as Roster) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

export function getServerSnapshot(): Roster {
  return EMPTY;
}

export function saveRoster(next: Roster) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode: the lineup just won't persist */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
