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

export function currentPrices(pairs: PricePair[]): PricePair | undefined {
  const nowMs = Date.now();
  return pairs.find(
    (p) =>
      new Date(p.startTime).getTime() <= nowMs &&
      new Date(p.endTime).getTime() >= nowMs
  );
}
