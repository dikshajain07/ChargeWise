import { CONFIG } from '../data/stations';
import type { ConnectorTypeId } from '../types/planner';
import type { Vehicle, VehicleInput, VehiclePreset } from '../types/user';

export interface VehicleDraft {
  presetId: string | null;
  brand: string;
  model: string;
  batteryKwh: string;
  efficiency: string;
  connectors: ConnectorTypeId[];
  recordBattery: boolean;
  batteryPct: number;
  reservePct: number;
}

export type VehicleDraftErrors = Partial<Record<'brand' | 'model' | 'batteryKwh' | 'efficiency' | 'connectors', string>>;

export function emptyDraft(defaultReserve = 15): VehicleDraft {
  return { presetId: null, brand: '', model: '', batteryKwh: '', efficiency: '', connectors: [], recordBattery: false, batteryPct: 50, reservePct: defaultReserve };
}

export function draftFromPreset(p: VehiclePreset, defaultReserve = 15): VehicleDraft {
  return {
    presetId: p.id,
    brand: p.brand,
    model: p.model,
    batteryKwh: String(p.batteryKwh),
    efficiency: p.efficiencyKwh100km != null ? String(p.efficiencyKwh100km) : '',
    connectors: p.connectors.slice(),
    recordBattery: false,
    batteryPct: 50,
    reservePct: defaultReserve
  };
}

export function draftFromVehicle(v: Vehicle): VehicleDraft {
  return {
    presetId: v.preset_id,
    brand: v.brand,
    model: v.model,
    batteryKwh: v.battery_kwh != null ? String(v.battery_kwh) : '',
    efficiency: v.efficiency_kwh_100km != null ? String(v.efficiency_kwh_100km) : '',
    connectors: v.connectors.slice(),
    recordBattery: v.battery_pct != null,
    batteryPct: v.battery_pct ?? 50,
    reservePct: v.reserve_pct
  };
}

const num = (s: string) => s.trim() === '' ? null : Number(s);

export function validateDraft(d: VehicleDraft): VehicleDraftErrors {
  const e: VehicleDraftErrors = {};
  if (!d.brand.trim()) e.brand = 'Enter the vehicle brand.';
  if (!d.model.trim()) e.model = 'Enter the model or variant.';
  const kwh = num(d.batteryKwh);
  if (kwh != null && (!isFinite(kwh) || kwh < 5 || kwh > 200)) e.batteryKwh = 'Battery capacity should be between 5 and 200 kWh.';
  const eff = num(d.efficiency);
  if (eff != null && (!isFinite(eff) || eff < 5 || eff > 40)) e.efficiency = 'Efficiency should be between 5 and 40 kWh/100 km.';
  if (!d.connectors.length) e.connectors = 'Select at least one connector your EV can charge with.';
  return e;
}

export function draftToInput(d: VehicleDraft): VehicleInput {
  return {
    preset_id: d.presetId,
    brand: d.brand.trim(),
    model: d.model.trim(),
    battery_kwh: num(d.batteryKwh),
    efficiency_kwh_100km: num(d.efficiency),
    connectors: d.connectors,
    battery_pct: d.recordBattery ? d.batteryPct : null,
    reserve_pct: d.reservePct
  };
}

export type RangeSource = 'calculated' | 'assumed' | 'manual';

/* Full-charge range from specs. With kWh + efficiency it's calculated; with
   kWh only it uses the planner's default 15 kWh/100 km assumption. */
export function rangeFromSpecs(kwh: number | null, eff: number | null): {range: number;source: RangeSource;} | null {
  if (kwh == null) return null;
  if (eff != null && eff > 0) return { range: kwh / eff * 100, source: 'calculated' };
  return { range: kwh / CONFIG.energyPerKm, source: 'assumed' };
}