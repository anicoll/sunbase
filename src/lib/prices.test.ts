import { describe, it, expect } from "vitest";
import { pairPrices, currentPrices } from "./prices";
import type { PriceInterval } from "../types/api";

// Helper to build a minimal PriceInterval
function interval(
  channelType: "general" | "feedIn",
  startTime: string,
  endTime: string,
  perKwh: number,
  forecast = false
): PriceInterval {
  return {
    id: Math.random(),
    channelType,
    createdAt: startTime,
    updatedAt: startTime,
    duration: 30,
    startTime,
    endTime,
    perKwh,
    spotPerKwh: perKwh,
    forecast,
  };
}

// Pairs of general+feedIn for a single time slot
function slot(
  start: string,
  end: string,
  buyPerKwh: number,
  feedInPerKwh: number,
  forecast = false
): PriceInterval[] {
  return [
    interval("general", start, end, buyPerKwh, forecast),
    interval("feedIn", start, end, feedInPerKwh, forecast),
  ];
}

describe("pairPrices", () => {
  it("pairs general and feedIn intervals by startTime", () => {
    const intervals = slot("2026-01-01T10:00:01Z", "2026-01-01T10:30:00Z", 10, -5);
    const pairs = pairPrices(intervals);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].buyPrice).toBe(10);
  });

  it("negates feedIn so positive sellPrice means you receive money", () => {
    // feedIn.perKwh = -5 → Amber pays you 5¢ → sellPrice should be +5
    const pairs = pairPrices(slot("2026-01-01T10:00:01Z", "2026-01-01T10:30:00Z", 10, -5));
    expect(pairs[0].sellPrice).toBe(5);
    expect(pairs[0].negativeSell).toBe(false);
  });

  it("sets negativeSell=true when feedIn is positive (you pay to export)", () => {
    // feedIn.perKwh = +3 → you pay to export → sellPrice = -3, negativeSell = true
    const pairs = pairPrices(slot("2026-01-01T10:00:01Z", "2026-01-01T10:30:00Z", 10, 3));
    expect(pairs[0].sellPrice).toBe(-3);
    expect(pairs[0].negativeSell).toBe(true);
  });

  it("sorts pairs ascending by startTime", () => {
    const intervals = [
      ...slot("2026-01-01T11:00:01Z", "2026-01-01T11:30:00Z", 12, -6),
      ...slot("2026-01-01T10:00:01Z", "2026-01-01T10:30:00Z", 10, -5),
    ];
    const pairs = pairPrices(intervals);
    expect(pairs[0].startTime).toBe("2026-01-01T10:00:01Z");
    expect(pairs[1].startTime).toBe("2026-01-01T11:00:01Z");
  });

  it("excludes slots missing either channel", () => {
    const intervals = [
      interval("general", "2026-01-01T10:00:01Z", "2026-01-01T10:30:00Z", 10),
      // no feedIn partner
    ];
    expect(pairPrices(intervals)).toHaveLength(0);
  });

  it("passes through forecast flag", () => {
    const pairs = pairPrices(
      slot("2026-01-01T10:00:01Z", "2026-01-01T10:30:00Z", 10, -5, true)
    );
    expect(pairs[0].forecast).toBe(true);
  });
});

describe("currentPrices", () => {
  const pairs = pairPrices([
    ...slot("2026-01-01T09:00:01Z", "2026-01-01T09:30:00Z", 8, -4),
    ...slot("2026-01-01T09:30:01Z", "2026-01-01T10:00:00Z", 9, -4.5),
    ...slot("2026-01-01T10:00:01Z", "2026-01-01T10:30:00Z", 10, -5),
  ]);

  it("returns the pair whose window contains the current time", () => {
    const mid = new Date("2026-01-01T09:15:00Z").getTime();
    const result = currentPrices(pairs, mid);
    expect(result?.startTime).toBe("2026-01-01T09:00:01Z");
  });

  it("returns undefined when no pair contains the current time", () => {
    const before = new Date("2026-01-01T08:00:00Z").getTime();
    expect(currentPrices(pairs, before)).toBeUndefined();
  });

  it("returns the most specific (latest-starting) pair when intervals overlap", () => {
    // Simulate Amber returning a 30-min interval AND a 5-min interval both containing nowMs.
    // The 5-min interval starts later → should be preferred.
    const thirtyMin = pairPrices([
      ...slot("2026-01-01T10:00:01Z", "2026-01-01T10:30:00Z", 10, -5),
    ]);
    const fiveMin = pairPrices([
      ...slot("2026-01-01T10:15:01Z", "2026-01-01T10:20:00Z", 11, -5.5),
    ]);
    const overlapping = [...thirtyMin, ...fiveMin].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const nowMs = new Date("2026-01-01T10:17:00Z").getTime();
    const result = currentPrices(overlapping, nowMs);
    // Should pick the 5-min interval (latest startTime), not the 30-min one
    expect(result?.startTime).toBe("2026-01-01T10:15:01Z");
  });
});
