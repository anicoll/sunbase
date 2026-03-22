// Raw API types matching the actual payload shapes

export interface PropertyReading {
  id: number;
  time_stamp: string;
  unit_of_measurement: string;
  value: string;
  identifier: string;
  slug: string;
}

export interface PriceInterval {
  id: number;
  channelType: "general" | "feedIn";
  createdAt: string;
  duration: number; // minutes
  endTime: string;
  startTime: string;
  forecast: boolean;
  perKwh: number; // cents — negative feedIn means you pay to export
  spotPerKwh: number;
  updatedAt: string;
}

// Derived / display types

export interface InverterStatus {
  batterySoc: number; // %
  batteryDischargingPower: number; // kW
  batteryChargingPower: number; // kW
  solarPower: number; // kW (total DC from MPPT)
  exportPower: number; // kW feed-in to grid
  importPower: number; // kW purchased from grid
  homeUsage: number; // kW load
  inverterTemp: number; // °C
  operatingStatus: string;
  dailyPvYield: number; // kWh today
  batteryChargeToday: number; // kWh today
  batteryDischargeToday: number; // kWh today
  feedInToday: number; // kWh today
  purchasedToday: number; // kWh today
}

// Amber Electric channel conventions:
//   general  = buy/import rate   — what you pay to consume; normally positive
//   feedIn   = sell/export rate  — negative = Amber pays you; positive = you pay to export (rare)
export interface PricePair {
  startTime: string;
  endTime: string;
  buyPrice: number;  // cents/kWh — from general channel; what you pay to import
  sellPrice: number; // cents/kWh — negated from feedIn; positive = you receive money
  forecast: boolean;
  negativeSell: boolean; // true when feedIn is positive (you pay to export — unusual)
}

export type InverterMode = "self_consume" | "full_charge" | "full_discharge";
