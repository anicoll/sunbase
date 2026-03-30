import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BatteryGauge from "@/components/BatteryGauge";
import StatCard from "@/components/StatCard";
import PriceChart from "@/components/PriceChart";
import { pairPrices, currentPrices } from "@/lib/prices";
import { parseInverterStatus } from "@/lib/properties";
import { useProperties } from "@/hooks/useProperties";
import { usePrices } from "@/hooks/usePrices";
import { useAuth } from "@/context/AuthContext";
import PowerGauge from "@/components/PowerGauge";
import { toast } from "sonner";
import type { InverterMode } from "@/types/api";

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

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted/40 ${className ?? ""}`}
      aria-hidden
    />
  );
}

export default function Dashboard() {
  const { client } = useAuth();
  const propertiesQuery = useProperties();
  const pricesQuery = usePrices();

  const status = propertiesQuery.data
    ? parseInverterStatus(propertiesQuery.data)
    : null;

  const pricePairs = pricesQuery.data ? pairPrices(pricesQuery.data) : [];
  const activePrices = currentPrices(pricePairs);

  const isFirstLoad = propertiesQuery.isLoading || pricesQuery.isLoading;
  const hasError = propertiesQuery.isError || pricesQuery.isError;

  // TODO PR-5: wire up to API mutation
  const activeMode: InverterMode | null = null;
  const handleMode = (mode: InverterMode) => {
    // TODO PR-5: POST /api/mode
    console.log("Mode change requested:", mode);
  };

  const handleAllowFeedIn = () => {
    client
      .allowFeedIn()
      .then(() => toast.success("Feed-in enabled"))
      .catch((err: unknown) => {
        toast.error("Failed to enable feed-in");
        console.error(err);
      });
  };

  const batteryPower =
    (status?.batteryDischargingPower ?? 0) > 0
      ? (status?.batteryDischargingPower ?? 0)
      : -(status?.batteryChargingPower ?? 0);

  const batteryLabel =
    batteryPower > 0
      ? `${fmt(batteryPower)} kW discharging`
      : batteryPower < 0
        ? `${fmt(Math.abs(batteryPower))} kW charging`
        : "Idle";

  const gridPower = (status?.importPower ?? 0) - (status?.exportPower ?? 0);
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
            {status && (
              <Badge variant="success" className="hidden sm:inline-flex">
                {status.operatingStatus}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasError && (
              <span className="text-xs text-solar-red">
                {propertiesQuery.isError && "Properties unavailable"}
                {propertiesQuery.isError && pricesQuery.isError && " · "}
                {pricesQuery.isError && "Prices unavailable"}
              </span>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isFirstLoad ? (
                <span className="h-2 w-2 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solar-green opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-solar-green" />
                </span>
              )}
              {isFirstLoad ? "Loading…" : "Live"}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-4">
        {/* Primary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Battery SOC — spans 2 cols on mobile so it's prominent */}
          <Card className="col-span-2 flex flex-col items-center justify-center py-4 sm:col-span-1">
            {isFirstLoad ? (
              <Skeleton className="h-[110px] w-[110px] rounded-full" />
            ) : (
              <BatteryGauge percentage={status?.batterySoc ?? 0} size={110} />
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {isFirstLoad ? <Skeleton className="h-3 w-24" /> : batteryLabel}
            </p>
          </Card>

          {isFirstLoad ? (
            <>
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
            </>
          ) : (
            <>
              <StatCard
                title="Solar"
                value={status?.solarPower ?? 0}
                unit="kW"
                accent="solar"
                subtitle={`${status?.dailyPvYield ?? 0} kWh today`}
              />
              <StatCard
                title="Home Usage"
                value={status?.homeUsage ?? 0}
                unit="kW"
                accent="home"
                subtitle={`${fmt((status?.homeUsage ?? 0) * 24)} kWh est.`}
              />
              <StatCard
                title="Grid"
                value={Math.abs(gridPower)}
                unit="kW"
                accent={gridPower > 0 ? "grid" : "battery"}
                subtitle={gridLabel}
              />
            </>
          )}
        </div>

        {/* Battery power + temperature gauges + current prices */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="flex flex-col items-center justify-center py-4">
            {isFirstLoad ? (
              <Skeleton className="h-[110px] w-[110px] rounded-full" />
            ) : (
              <PowerGauge
                value={status?.batteryChargingPower ?? 0}
                max={6}
                accent="charge"
                label="Charging"
                size={110}
              />
            )}
          </Card>
          <Card className="flex flex-col items-center justify-center py-4">
            {isFirstLoad ? (
              <Skeleton className="h-[110px] w-[110px] rounded-full" />
            ) : (
              <PowerGauge
                value={status?.batteryDischargingPower ?? 0}
                max={6}
                accent="discharge"
                label="Discharging"
                size={110}
              />
            )}
          </Card>
          <Card className="flex flex-col items-center justify-center py-4">
            {isFirstLoad ? (
              <Skeleton className="h-[110px] w-[110px] rounded-full" />
            ) : (
              <PowerGauge
                value={status?.inverterTemp ?? 0}
                max={80}
                accent="temp"
                label="Inv. Temp"
                unit="°C"
                decimals={1}
                size={110}
              />
            )}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Current Prices</CardTitle>
            </CardHeader>
            <CardContent>
              {isFirstLoad ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ) : activePrices ? (
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Buy</p>
                    <p className="text-xl font-bold text-solar-blue">
                      {activePrices.buyPrice.toFixed(1)}
                      <span className="text-sm font-normal text-muted-foreground">¢</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sell</p>
                    <p className={`text-xl font-bold ${activePrices.negativeSell ? "text-solar-red" : "text-solar-green"}`}>
                      {activePrices.sellPrice.toFixed(1)}
                      <span className="text-sm font-normal text-muted-foreground">¢</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Unavailable</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary stats + actions */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Today's summary */}
          <Card className="sm:col-span-1">
            <CardHeader>
              <CardTitle>Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isFirstLoad ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Solar generated</span>
                    <span className="font-medium text-solar-yellow">
                      {status?.dailyPvYield ?? 0} kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Battery charged</span>
                    <span className="font-medium text-solar-green">
                      {status?.batteryChargeToday ?? 0} kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Battery discharged</span>
                    <span className="font-medium text-solar-blue">
                      {status?.batteryDischargeToday ?? 0} kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exported</span>
                    <span className="font-medium">
                      {status?.feedInToday ?? 0} kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchased</span>
                    <span className="font-medium">
                      {status?.purchasedToday ?? 0} kWh
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
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
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-bold tracking-wide"
                  onClick={handleAllowFeedIn}
                >
                  Allow Feed-in
                </Button>
              </CardContent>
            </Card>
        </div>

        {/* Price chart */}
        {pricesQuery.isLoading ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : (
          <PriceChart pairs={pricePairs} />
        )}
      </main>
    </div>
  );
}
