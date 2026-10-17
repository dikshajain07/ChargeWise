import type { ConnectorTypeId, ModeKey } from './planner';

export type ThemeName = 'dark' | 'light';

export interface Profile {
  id: string;
  full_name: string | null;
  onboarding_done: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  preset_id: string | null;
  brand: string;
  model: string;
  battery_kwh: number | null;
  efficiency_kwh_100km: number | null;
  connectors: ConnectorTypeId[];
  battery_pct: number | null;
  reserve_pct: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export type VehicleInput = Omit<Vehicle, 'id' | 'user_id' | 'is_primary' | 'created_at' | 'updated_at'>;

export interface Preferences {
  user_id: string;
  theme: ThemeName;
  priority_mode: ModeKey;
  default_reserve: number;
  sound_on: boolean;
}

export interface JourneySummary {
  distanceKm: number;
  stops: number;
  costRs: number;
  waitMin: number;
  chargeMin: number;
  arrivalPct: number;
  timeMin: number;
  modelHour: number;
}

export interface Journey {
  id: string;
  user_id: string;
  origin_name: string;
  destination_name: string;
  summary: JourneySummary;
  feasible: boolean;
  created_at: string;
}

export interface SavedStation {
  id: string;
  user_id: string;
  station_id: string;
  created_at: string;
}

export interface VehiclePreset {
  id: string;
  brand: string;
  model: string;
  batteryKwh: number;
  efficiencyKwh100km: number | null;
  connectors: ConnectorTypeId[];
  source: string;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
}