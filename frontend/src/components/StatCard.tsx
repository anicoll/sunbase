import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Accent = "default" | "solar" | "battery" | "grid" | "home" | "temp";

const accentStyles: Record<Accent, string> = {
  default: "text-foreground",
  solar: "text-solar-yellow",
  battery: "text-solar-green",
  grid: "text-solar-blue",
  home: "text-purple-400",
  temp: "text-orange-400",
};

interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  accent?: Accent;
  subtitle?: string;
  className?: string;
}

export default function StatCard({
  title,
  value,
  unit,
  accent = "default",
  subtitle,
  className,
}: StatCardProps) {
  const valueStr =
    typeof value === "number"
      ? value >= 10
        ? value.toFixed(1)
        : value.toFixed(3)
      : value;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-2xl font-bold tabular-nums",
              accentStyles[accent]
            )}
          >
            {valueStr}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
