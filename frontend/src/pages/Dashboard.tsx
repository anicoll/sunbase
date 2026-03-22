import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BatteryGauge from "@/components/BatteryGauge";
import StatCard from "@/components/StatCard";
import PriceChart from "@/components/PriceChart";
import { pairPrices, currentPrices } from "@/lib/prices";
import type { InverterStatus, PriceInterval, InverterMode } from "@/types/api";

// TODO PR-2: Replace with React Query hooks fetching from /api/properties and /api/prices
const MOCK_STATUS: InverterStatus = {
  batterySoc: 27.3,
  batteryDischargingPower: 0.524,
  batteryChargingPower: 0,
  solarPower: 0,
  exportPower: 0,
  importPower: 0,
  homeUsage: 0.524,
  inverterTemp: 37.6,
  operatingStatus: "Grid-connected operation",
  dailyPvYield: 39.8,
  batteryChargeToday: 24.6,
  batteryDischargeToday: 21.3,
  feedInToday: 4.9,
  purchasedToday: 0,
};

const MOCK_PRICES: PriceInterval[] = [
  // Actual prices (past)
  ...Array.from({ length: 8 }, (_, i) => {
    const base = new Date("2026-03-21T19:00:00+10:30");
    const start = new Date(base.getTime() + i * 30 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    return [
      {
        id: i * 2,
        channelType: "general" as const,
        createdAt: start.toISOString(),
        duration: 30,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        forecast: false,
        perKwh: 12 + Math.random() * 8,
        spotPerKwh: 10,
        updatedAt: start.toISOString(),
      },
      {
        id: i * 2 + 1,
        channelType: "feedIn" as const,
        createdAt: start.toISOString(),
        duration: 30,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        forecast: false,
        perKwh: -(8 + Math.random() * 4),
        spotPerKwh: 10,
        updatedAt: start.toISOString(),
      },
    ];
  }).flat(),
  // Forecast prices (future)
  ...Array.from({ length: 8 }, (_, i) => {
    const base = new Date("2026-03-21T23:00:00+10:30");
    const start = new Date(base.getTime() + i * 30 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    return [
      {
        id: 100 + i * 2,
        channelType: "general" as const,
        createdAt: start.toISOString(),
        duration: 30,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        forecast: true,
        perKwh: 20 + Math.random() * 10,
        spotPerKwh: 18,
        updatedAt: start.toISOString(),
      },
      {
        id: 100 + i * 2 + 1,
        channelType: "feedIn" as const,
        createdAt: start.toISOString(),
        duration: 30,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        forecast: true,
        perKwh: -(12 + Math.random() * 5),
        spotPerKwh: 18,
        updatedAt: start.toISOString(),
      },
    ];
  }).flat(),
];

function fmt(kw: number) {
  return kw.toFixed(3);
}

function ModeButton({
  mode,
  label,
  current,
  onClick,
}: {
  mode: InverterMode;
  label: string;
  current: InverterMode | null;
  onClick: (m: InverterMode) => void;
}) {
  const variants: Record<InverterMode, "charge" | "self" | "discharge"> = {
    full_charge: "charge",
    self_consume: "self",
    full_discharge: "discharge",
  };
  return (
    <Button
      variant={variants[mode]}
      size="sm"
      className="w-full text-xs font-bold tracking-wide"
      onClick={() => onClick(mode)}
      aria-pressed={current === mode}
      style={{ opacity: current && current !== mode ? 0.6 : 1 }}
    >
      {label}
    </Button>
  );
}

export default function Dashboard() {
  // TODO PR-2: replace with useQuery hooks
  const status = MOCK_STATUS;
  const pricePairs = pairPrices(MOCK_PRICES);
  const activePrices = currentPrices(pricePairs);

  // TODO PR-5: wire up to API mutation
  const activeMode: InverterMode | null = null;
  const handleMode = (mode: InverterMode) => {
    // TODO PR-5: POST /api/mode
    console.log("Mode change requested:", mode);
  };

  const batteryPower =
    status.batteryDischargingPower > 0
      ? status.batteryDischargingPower
      : -status.batteryChargingPower;

  const batteryLabel =
    batteryPower > 0
      ? `${fmt(batteryPower)} kW discharging`
      : batteryPower < 0
        ? `${fmt(Math.abs(batteryPower))} kW charging`
        : "Idle";

  const gridPower = status.importPower - status.exportPower;
  const gridLabel =
    gridPower > 0
      ? `${fmt(gridPower)} kW importing`
      : gridPower < 0
        ? `${fmt(Math.abs(gridPower))} kW exporting`
        : "No grid flow";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">Sunbase</span>
            <Badge variant="success" className="hidden sm:inline-flex">
              {status.operatingStatus}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solar-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-solar-green" />
            </span>
            Live
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-4">
        {/* Primary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Battery SOC — spans 2 on mobile so it's prominent */}
          <Card className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center py-4">
            <BatteryGauge percentage={status.batterySoc} size={110} />
            <p className="mt-1 text-xs text-muted-foreground">{batteryLabel}</p>
          </Card>

          <StatCard
            title="Solar"
            value={status.solarPower}
            unit="kW"
            accent="solar"
            subtitle={`${status.dailyPvYield} kWh today`}
          />
          <StatCard
            title="Home Usage"
            value={status.homeUsage}
            unit="kW"
            accent="home"
            subtitle={`${fmt(status.homeUsage * 24)} kWh est.`}
          />
          <StatCard
            title="Grid"
            value={Math.abs(gridPower)}
            unit="kW"
            accent={gridPower > 0 ? "grid" : "battery"}
            subtitle={gridLabel}
          />
        </div>

        {/* Secondary stats + actions */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Inverter detail */}
          <Card className="sm:col-span-1">
            <CardHeader>
              <CardTitle>Inverter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temperature</span>
                <span className="font-medium text-orange-400">
                  {status.inverterTemp.toFixed(1)} °C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Battery charge</span>
                <span className="font-medium text-solar-green">
                  {fmt(status.batteryChargingPower)} kW
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Battery discharge</span>
                <span className="font-medium text-solar-yellow">
                  {fmt(status.batteryDischargingPower)} kW
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Today's summary */}
          <Card className="sm:col-span-1">
            <CardHeader>
              <CardTitle>Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Solar generated</span>
                <span className="font-medium text-solar-yellow">
                  {status.dailyPvYield} kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Battery charged</span>
                <span className="font-medium text-solar-green">
                  {status.batteryChargeToday} kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Battery discharged</span>
                <span className="font-medium text-solar-blue">
                  {status.batteryDischargeToday} kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exported</span>
                <span className="font-medium">{status.feedInToday} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchased</span>
                <span className="font-medium">{status.purchasedToday} kWh</span>
              </div>
            </CardContent>
          </Card>

          {/* Prices + Actions */}
          <div className="flex flex-col gap-3 sm:col-span-1">
            {activePrices && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Prices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Buy</p>
                      <p className="text-xl font-bold text-solar-blue">
                        {activePrices.buyPrice.toFixed(1)}
                        <span className="text-sm font-normal text-muted-foreground">
                          ¢
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sell</p>
                      <p
                        className={`text-xl font-bold ${activePrices.negativeSell ? "text-solar-red" : "text-solar-green"}`}
                      >
                        {activePrices.sellPrice.toFixed(1)}
                        <span className="text-sm font-normal text-muted-foreground">
                          ¢
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Control Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ModeButton
                  mode="full_charge"
                  label="Full Charge"
                  current={activeMode}
                  onClick={handleMode}
                />
                <ModeButton
                  mode="self_consume"
                  label="Self Consume"
                  current={activeMode}
                  onClick={handleMode}
                />
                <ModeButton
                  mode="full_discharge"
                  label="Full Discharge"
                  current={activeMode}
                  onClick={handleMode}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Price chart */}
        <PriceChart pairs={pricePairs} />
      </main>
    </div>
  );
}
