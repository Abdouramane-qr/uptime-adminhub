type FallbackStore = Record<string, number>;

declare global {
  interface Window {
    __adminhubFallbackHits?: FallbackStore;
  }
}

export function reportFallbackHit(page: string): void {
  if (typeof window === "undefined") return;
  if (!window.__adminhubFallbackHits) {
    window.__adminhubFallbackHits = {};
  }
  window.__adminhubFallbackHits[page] = (window.__adminhubFallbackHits[page] || 0) + 1;

  if (import.meta.env.DEV) {
    // Dev-only trace for quick fallback diagnostics in browser console.
    console.warn(`[fallback-hit] ${page} (${window.__adminhubFallbackHits[page]})`);
  }
}
