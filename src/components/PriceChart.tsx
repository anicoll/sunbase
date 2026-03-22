import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Brush,
} from "recharts";
import type { PricePair } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriceChartProps {
  pairs: PricePair[];
}

// Visible intervals by breakpoint (30 min each)
const WINDOW_MOBILE = 8;   // 4 h
const WINDOW_DESKTOP = 18; // 9 h

function defaultWindow() {
  return window.innerWidth >= 640 ? WINDOW_DESKTOP : WINDOW_MOBILE;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(2)}¢
        </p>
      ))}
    </div>
  );
}

export default function PriceChart({ pairs }: PriceChartProps) {
  const nowMs = Date.now();
  const data = pairs.map((p) => ({
    time: formatTime(p.startTime),
    buy: p.buyPrice,
    sell: p.sellPrice,
    negativeSell: p.negativeSell,
    isPast: new Date(p.endTime).getTime() < nowMs,
  }));

  const currentPair = pairs.find(
    (p) => new Date(p.startTime).getTime() <= nowMs && new Date(p.endTime).getTime() >= nowMs
  );
  const nowLabel = currentPair ? formatTime(currentPair.startTime) : undefined;

  const [brushStart, setBrushStart] = useState(0);
  const [brushEnd, setBrushEnd] = useState(() => defaultWindow() - 1);

  // Refs so the wheel handler always reads the latest state without re-binding
  const brushStartRef = useRef(brushStart);
  const brushEndRef = useRef(brushEnd);
  brushStartRef.current = brushStart;
  brushEndRef.current = brushEnd;

  const dataLenRef = useRef(data.length);
  dataLenRef.current = data.length;

  const containerRef = useRef<HTMLDivElement>(null);

  // Centre the window on the current interval whenever the dataset size changes.
  // Intentionally depends only on pairs.length — we don't want to reset the
  // user's position on every background refetch, only when new intervals arrive.
  useEffect(() => {
    if (pairs.length === 0) return;
    const win = defaultWindow();
    const now = Date.now();
    const idx = pairs.findIndex(
      (p) =>
        new Date(p.startTime).getTime() <= now &&
        new Date(p.endTime).getTime() >= now
    );
    const start = idx === -1 ? 0 : Math.max(0, idx - 2);
    const end = Math.min(pairs.length - 1, start + win - 1);
    setBrushStart(start);
    setBrushEnd(end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs.length]);

  // Mousewheel pans the window without changing its size.
  // passive:false lets us preventDefault so the page doesn't also scroll.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Scale delta: trackpads emit small fractional values, mice emit ~100
      const step = Math.sign(e.deltaY) * Math.max(1, Math.round(Math.abs(e.deltaY) / 40));
      const winSize = brushEndRef.current - brushStartRef.current;
      const maxStart = dataLenRef.current - 1 - winSize;

      const newStart = Math.max(0, Math.min(maxStart, brushStartRef.current + step));
      setBrushStart(newStart);
      setBrushEnd(newStart + winSize);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []); // bind once — reads latest values via refs

  return (
    <Card>
      <CardHeader>
        <CardTitle>Electricity Prices (¢/kWh)</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div ref={containerRef}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              barCategoryGap="20%"
              barGap={2}
            >
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              {nowLabel && (
                <ReferenceLine
                  x={nowLabel}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  label={{ value: "NOW", position: "top", fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                />
              )}

              <Bar dataKey="buy" name="Buy" radius={[2, 2, 0, 0]}>
                {data.slice(brushStart, brushEnd + 1).map((entry, i) => (
                  <Cell
                    key={`buy-${brushStart + i}`}
                    fill="#3B82F6"
                    fillOpacity={entry.isPast ? 0.3 : 1}
                  />
                ))}
              </Bar>
              <Bar dataKey="sell" name="Sell" radius={[2, 2, 0, 0]}>
                {data.slice(brushStart, brushEnd + 1).map((entry, i) => (
                  <Cell
                    key={`sell-${brushStart + i}`}
                    fill={entry.negativeSell ? "#EF4444" : "#10B981"}
                    fillOpacity={entry.isPast ? 0.3 : 1}
                  />
                ))}
              </Bar>

              <Brush
                dataKey="time"
                startIndex={brushStart}
                endIndex={brushEnd}
                height={28}
                travellerWidth={10}
                stroke="hsl(var(--border))"
                fill="hsl(var(--card))"
                onChange={(range) => {
                  if (
                    range.startIndex !== undefined &&
                    range.endIndex !== undefined
                  ) {
                    setBrushStart(range.startIndex);
                    setBrushEnd(range.endIndex);
                  }
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap gap-3 px-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-solar-blue" />
            Buy
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-solar-green" />
            Sell (credit)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-solar-red" />
            Sell (penalty)
          </span>
          <span className="flex items-center gap-1 text-muted-foreground/60 italic">
            Faded = past
          </span>
          <span className="ml-auto hidden sm:inline text-muted-foreground/60">
            Scroll to pan · drag handles to zoom
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
