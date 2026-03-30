type Accent = "charge" | "discharge" | "solar" | "grid" | "temp";

const accentClass: Record<Accent, string> = {
  charge: "text-solar-green",
  discharge: "text-solar-yellow",
  solar: "text-solar-yellow",
  grid: "text-solar-blue",
  temp: "text-orange-400",
};

interface PowerGaugeProps {
  value: number;
  max: number;
  accent?: Accent;
  label: string;
  unit?: string;
  decimals?: number;
  size?: number;
}

export default function PowerGauge({
  value,
  max,
  accent = "charge",
  label,
  unit = "kW",
  decimals = 2,
  size = 120,
}: PowerGaugeProps) {
  const cx = 60;
  const cy = 60;
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.75; // 270° span
  const clamped = Math.min(Math.max(value, 0), max);
  const fillLength = max > 0 ? arcLength * (clamped / max) : 0;

  return (
    <div className={accentClass[accent]}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        aria-label={`${label} ${value.toFixed(decimals)} ${unit}`}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          transform={`rotate(135 ${cx} ${cy})`}
        />
        {/* Fill */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${fillLength} ${circumference - fillLength}`}
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="currentColor"
          fontSize={14}
          fontWeight={700}
        >
          {value.toFixed(decimals)} {unit}
        </text>
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          fill="currentColor"
          fillOpacity={0.5}
          fontSize={9}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
