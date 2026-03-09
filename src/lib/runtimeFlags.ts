export function allowMockFallback(): boolean {
  const raw = import.meta.env.VITE_ALLOW_MOCK_FALLBACK;
  // Strict by default: mock fallback must be explicitly enabled.
  if (raw === undefined || raw === null || raw === "") return false;
  return String(raw).toLowerCase() === "true";
}
