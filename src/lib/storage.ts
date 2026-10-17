import type { StateStorage } from "zustand/middleware";

/**
 * Persistence abstraction. The app only talks to a StateStorage; a future backend-backed implementation
 * can replace `safeLocalStorage` without touching the store. Reads/writes never throw (private mode, quota, blocked storage).
 */
const memory = new Map<string, string>();

export const safeLocalStorage: StateStorage = {
  getItem(name) {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(name) : memory.get(name) ?? null;
      if (raw === null) return null;
      JSON.parse(raw); // reject malformed payloads instead of crashing hydration
      return raw;
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    try { window.localStorage.setItem(name, value); } catch { memory.set(name, value); }
  },
  removeItem(name) {
    try { window.localStorage.removeItem(name); } catch { /* ignore */ }
    memory.delete(name);
  },
};

export function readFlag(key: string): boolean {
  try { return window.localStorage.getItem(key) === "1"; } catch { return false; }
}
export function writeFlag(key: string, on: boolean) {
  try { if (on) window.localStorage.setItem(key, "1"); else window.localStorage.removeItem(key); } catch { /* ignore */ }
}
export function readSessionFlag(key: string): boolean {
  try { return window.sessionStorage.getItem(key) === "1"; } catch { return false; }
}
export function writeSessionFlag(key: string) {
  try { window.sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
}
