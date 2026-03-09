export function allowMockFallback(): boolean {
  const raw = import.meta.env.VITE_ALLOW_MOCK_FALLBACK;
  if (raw === undefined || raw === null || raw === "") return true;
  return String(raw).toLowerCase() === "true";
}
