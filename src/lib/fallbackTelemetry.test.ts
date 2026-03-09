import { beforeEach, describe, expect, it } from "vitest";
import { reportFallbackHit } from "@/lib/fallbackTelemetry";

describe("fallbackTelemetry", () => {
  beforeEach(() => {
    window.__adminhubFallbackHits = {};
  });

  it("increments per page fallback counters", () => {
    reportFallbackHit("Billing");
    reportFallbackHit("Billing");
    reportFallbackHit("Technicians");

    expect(window.__adminhubFallbackHits?.Billing).toBe(2);
    expect(window.__adminhubFallbackHits?.Technicians).toBe(1);
  });
});
