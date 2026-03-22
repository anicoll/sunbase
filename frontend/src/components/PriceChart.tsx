import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { PricePair } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriceChartProps {
  pairs: PricePair[];
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
  const data = pairs.map((p) => ({
    time: formatTime(p.startTime),
    buy: p.buyPrice,
    sell: p.sellPrice,
    forecast: p.forecast,
    negativeSell: p.negativeSell,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Electricity Prices (¢/kWh)</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ResponsiveContainer width="100%" height={180}>
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
            <Bar dataKey="buy" name="Buy" radius={[2, 2, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.forecast
                      ? "hsl(var(--muted-foreground))"
                      : "#3B82F6"
                  }
                  fillOpacity={entry.forecast ? 0.5 : 1}
                />
              ))}
            </Bar>
            <Bar dataKey="sell" name="Sell" radius={[2, 2, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.negativeSell ? "#EF4444" : "#10B981"}
                  fillOpacity={entry.forecast ? 0.5 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap gap-3 px-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-solar-blue" />
            Buy (actual)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-solar-green" />
            Sell (actual)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-solar-red" />
            Negative spot
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-muted-foreground opacity-50" />
            Forecast
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
