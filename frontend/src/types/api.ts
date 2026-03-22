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

export interface PricePair {
  startTime: string;
  endTime: string;
  buyPrice: number; // cents/kWh
  sellPrice: number; // cents/kWh (absolute value)
  forecast: boolean;
  negativeSell: boolean; // true when spot is negative (pay to export)
}

export type InverterMode = "self_consume" | "full_charge" | "full_discharge";

// Amber Electric uses negative perKwh for feedIn to indicate
// the customer receives that amount (positive = receive, stored as negative)
export function parseSellPrice(perKwh: number): {
  price: number;
  negative: boolean;
} {
  return { price: Math.abs(perKwh), negative: perKwh < 0 };
}
