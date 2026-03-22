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
      // general = buy/import rate; what you pay to consume from the grid
      pair.buyPrice = interval.perKwh;
    } else {
      // feedIn = sell/export rate; negate so positive = you receive money
      pair.sellPrice = -interval.perKwh;
      pair.negativeSell = interval.perKwh > 0;
    }
  }

  return (
    Array.from(byTime.values()).filter(
      (p): p is PricePair =>
        p.buyPrice !== undefined && p.sellPrice !== undefined
    ) as PricePair[]
  ).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

export function currentPrices(pairs: PricePair[], nowMs = Date.now()): PricePair | undefined {
  // pairs is sorted ascending — reverse to get the most specific (latest-starting) match
  return [...pairs].reverse().find(
    (p) =>
      new Date(p.startTime).getTime() <= nowMs &&
      new Date(p.endTime).getTime() >= nowMs
  );
}

/** Returns the index of the current interval in a sorted pairs array, or -1 if none matches. */
export function currentPriceIndex(pairs: PricePair[], nowMs = Date.now()): number {
  const reversedIdx = [...pairs].reverse().findIndex(
    (p) =>
      new Date(p.startTime).getTime() <= nowMs &&
      new Date(p.endTime).getTime() >= nowMs
  );
  return reversedIdx === -1 ? -1 : pairs.length - 1 - reversedIdx;
}
