import type { PropertyReading, InverterStatus } from "../types/api";

const INVERTER_PREFIX = "SH60RS";

function getNum(readings: PropertyReading[], slug: string): number {
  const r = readings.find(
    (r) => r.slug === slug && r.identifier.startsWith(INVERTER_PREFIX)
  );
  return r ? parseFloat(r.value) : 0;
}

function getStr(readings: PropertyReading[], slug: string): string {
  const r = readings.find(
    (r) => r.slug === slug && r.identifier.startsWith(INVERTER_PREFIX)
  );
  return r?.value ?? "";
}

export function parseInverterStatus(
  readings: PropertyReading[]
): InverterStatus {
  return {
    batterySoc: getNum(readings, "battery_level_soc"),
    batteryDischargingPower: getNum(readings, "battery_discharging_power"),
    batteryChargingPower: getNum(readings, "battery_charging_power"),
    solarPower: getNum(readings, "total_dc_power"),
    exportPower: getNum(readings, "total_feed_in_active_power"),
    importPower: getNum(readings, "grid_energy_purchasing_power"),
    homeUsage: getNum(readings, "total_active_power_of_load"),
    inverterTemp: getNum(readings, "internal_air_temperature"),
    operatingStatus: getStr(readings, "operating_status"),
    dailyPvYield: getNum(readings, "daily_pv_yield"),
    batteryChargeToday: getNum(readings, "battery_charge_today"),
    batteryDischargeToday: getNum(readings, "battery_discharge_today"),
    feedInToday: getNum(readings, "feed_in_energy_today_pv"),
    purchasedToday: getNum(readings, "energy_purchased_today"),
  };
}
