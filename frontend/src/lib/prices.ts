import type { PriceInterval, PricePair } from "../types/api";

export function pairPrices(intervals: PriceInterval[]): PricePair[] {
  const byTime = new Map<string, Partial<PricePair>>();

  for (const interval of intervals) {
    const key = interval.startTime;
    if (!byTime.has(key)) {
      byTime.set(key, {
        startTime: interval.startTime,
        endTime: interval.endTime,
        forecast: interval.forecast,
        negativeSell: false,
      });
    }
    const pair = byTime.get(key)!;
    if (interval.channelType === "general") {
      pair.buyPrice = interval.perKwh;
    } else {
      pair.sellPrice = Math.abs(interval.perKwh);
      pair.negativeSell = interval.perKwh < 0;
    }
  }

  return (
    Array.from(byTime.values()).filter(
      (p): p is PricePair =>
        p.buyPrice !== undefined && p.sellPrice !== undefined
    ) as PricePair[]
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function currentPrices(pairs: PricePair[]): PricePair | undefined {
  const now = new Date().toISOString();
  return pairs.find((p) => p.startTime <= now && p.endTime >= now);
}
