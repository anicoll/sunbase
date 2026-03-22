interface BatteryGaugeProps {
  percentage: number;
  size?: number;
}

export default function BatteryGauge({
  percentage,
  size = 120,
}: BatteryGaugeProps) {
  const cx = 60;
  const cy = 60;
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.75; // 270° span
  const fillLength = arcLength * Math.min(Math.max(percentage, 0), 100) / 100;

  const color =
    percentage <= 15
      ? "#EF4444"
      : percentage <= 30
        ? "#F59E0B"
        : "#10B981";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-label={`Battery ${percentage.toFixed(1)}%`}
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
        stroke={color}
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
        fontSize={18}
        fontWeight={700}
      >
        {percentage.toFixed(1)}%
      </text>
      <text
        x={cx}
        y={cy + 13}
        textAnchor="middle"
        fill="currentColor"
        fillOpacity={0.5}
        fontSize={9}
      >
        Battery SOC
      </text>
    </svg>
  );
}
