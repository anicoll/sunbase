// Raw API types matching the actual payload shapes

export interface PropertyReading {
  id: number;
  time_stamp: string;
  unit_of_measurement: string;
  value: string;
  identifier: string;
  slug: string;
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

export type InverterMode = "self_consume" | "full_charge" | "full_discharge";

