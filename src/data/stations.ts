import type {
  ConnectorTypeDef,
  ConnectorTypeId,
  DemandProfile,
  DestinationOption,
  FactorKey,
  ModeKey,
  Place,
  Plug,
  Station,
  Weights } from
'../types/planner';

/* ChargeWise network model — Delhi NCR.
   Every station, connector price, plug availability, utilisation, queue and
   waiting-time figure here is SIMULATED. Distances are straight-line
   (Haversine) estimates multiplied by a configurable road factor. */

export const CONFIG = {
  energyPerKm: 0.15, // kWh/km default assumption → battery size = range × 0.15
  sessionKwh: 22, // typical charging session used by the queue model
  chargeEfficiency: 0.9, // grid-to-battery efficiency for cost estimates
  chargerEfficiency: 0.85, // share of rated kW actually delivered on average
  avgSpeedKmh: 50, // average travel speed for ETAs
  defaultHour: 18, // model time 18:00 (evening peak)
  targetPct: 80, // default charge target for recommendations
  overloadedUtil: 0.9,
  underusedUtil: 0.45,
  coverageRadiusKm: 7,
  mapCenter: [28.6, 77.2] as [number, number]
};

export const CONNECTOR_TYPES: ConnectorTypeDef[] = [
{ id: 'CCS2', kind: 'DC' },
{ id: 'Type 2', kind: 'AC' },
{ id: 'CHAdeMO', kind: 'DC' },
{ id: 'Bharat DC-001', kind: 'DC' },
{ id: 'Bharat AC-001', kind: 'AC' }];


export const PRESET_ORIGINS: Place[] = [
{ id: 'cp', name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
{ id: 'hauzkhas', name: 'Hauz Khas', lat: 28.5494, lng: 77.2001 },
{ id: 'noida50', name: 'Noida Sector 50', lat: 28.5714, lng: 77.3614 },
{ id: 'gurugram29', name: 'Gurugram Sector 29', lat: 28.4677, lng: 77.064 }];


export const DESTINATIONS: DestinationOption[] = [
{ id: 'none', name: 'No destination — charge nearby' },
{ id: 'cybercity', name: 'Gurugram Cyber City', lat: 28.495, lng: 77.089 },
{ id: 'airport', name: 'IGI Airport T3', lat: 28.5562, lng: 77.1 },
{ id: 'noida62', name: 'Noida Sector 62', lat: 28.6208, lng: 77.3639 },
{ id: 'jaipur', name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
{ id: 'agra', name: 'Agra', lat: 27.1751, lng: 78.0421 },
{ id: 'chandigarh', name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
{ id: 'custom', name: 'Custom — pick on map' }];


const P = (type: ConnectorTypeId, kw: number, count: number, price: number): Plug => ({ type, kw, count, price });

type RawStation = Omit<Station, 'points'>;

/* peakUtil = utilisation at the station's daily peak. All live-looking fields
   (utilisation, free plugs, queue, wait, status) are DERIVED by the demand model. */
const RAW_STATIONS: RawStation[] = [
{ id: 'cp', name: 'Connaught Place Hub', area: 'Central Delhi', type: 'city', lat: 28.6328, lng: 77.2197, plugs: [P('CCS2', 60, 4, 22), P('Type 2', 22, 2, 16)], profile: 'commercial', peakUtil: 0.97, online: true },
{ id: 'saket', name: 'Saket Select Mall', area: 'South Delhi', type: 'city', lat: 28.5286, lng: 77.2193, plugs: [P('CCS2', 60, 3, 19.5), P('CHAdeMO', 50, 1, 18)], profile: 'commercial', peakUtil: 1.02, online: true },
{ id: 'nehru', name: 'Nehru Place Metro', area: 'South Delhi', type: 'city', lat: 28.5494, lng: 77.253, plugs: [P('CCS2', 30, 3, 17.5), P('Type 2', 22, 2, 14)], profile: 'commercial', peakUtil: 0.62, online: true },
{ id: 'lajpat', name: 'Lajpat Nagar Market', area: 'South Delhi', type: 'city', lat: 28.5677, lng: 77.2433, plugs: [P('CCS2', 60, 4, 18)], profile: 'commercial', peakUtil: 0.8, online: false },
{ id: 'aerocity', name: 'Aerocity Plaza', area: 'South-West Delhi', type: 'city', lat: 28.5486, lng: 77.1205, plugs: [P('CCS2', 120, 4, 24)], profile: 'commercial', peakUtil: 0.74, online: true },
{ id: 'dwarka', name: 'Dwarka Sector 21', area: 'West Delhi', type: 'city', lat: 28.5523, lng: 77.0583, plugs: [P('CCS2', 60, 3, 17), P('Type 2', 22, 2, 13), P('Bharat DC-001', 15, 1, 12)], profile: 'residential', peakUtil: 0.38, online: true },
{ id: 'rajouri', name: 'Rajouri Garden', area: 'West Delhi', type: 'city', lat: 28.6492, lng: 77.122, plugs: [P('CCS2', 30, 2, 18.5), P('Type 2', 7.4, 2, 12)], profile: 'residential', peakUtil: 0.72, online: true },
{ id: 'pitampura', name: 'Pitampura NSP', area: 'North Delhi', type: 'city', lat: 28.6905, lng: 77.152, plugs: [P('CCS2', 30, 2, 17.5), P('Bharat DC-001', 15, 1, 13)], profile: 'commercial', peakUtil: 0.55, online: true },
{ id: 'noida18', name: 'Noida Sector 18', area: 'Noida', type: 'city', lat: 28.5708, lng: 77.326, plugs: [P('CCS2', 60, 3, 20.5), P('CHAdeMO', 50, 2, 19)], profile: 'commercial', peakUtil: 0.94, online: true },
{ id: 'noida62', name: 'Noida Sector 62', area: 'Noida', type: 'city', lat: 28.627, lng: 77.3649, plugs: [P('CCS2', 60, 4, 16), P('Type 2', 22, 2, 12.5)], profile: 'commercial', peakUtil: 0.4, online: true },
{ id: 'rajnagar', name: 'Raj Nagar Extension', area: 'Ghaziabad', type: 'city', lat: 28.682, lng: 77.441, plugs: [P('Type 2', 22, 2, 14), P('Bharat AC-001', 3.3, 2, 10)], profile: 'residential', peakUtil: 0.45, online: true },
{ id: 'cyberhub', name: 'Cyber Hub Gurugram', area: 'Gurugram', type: 'city', lat: 28.495, lng: 77.0895, plugs: [P('CCS2', 120, 4, 24), P('Type 2', 22, 2, 17)], profile: 'commercial', peakUtil: 1.12, online: true },
{ id: 'golf', name: 'Golf Course Road', area: 'Gurugram', type: 'city', lat: 28.4421, lng: 77.101, plugs: [P('CCS2', 60, 3, 18.5), P('CHAdeMO', 50, 2, 17.5)], profile: 'commercial', peakUtil: 0.42, online: true },
{ id: 'faridabad', name: 'Faridabad Sector 15', area: 'Faridabad', type: 'city', lat: 28.396, lng: 77.315, plugs: [P('CCS2', 30, 2, 15.5), P('Type 2', 22, 2, 12)], profile: 'residential', peakUtil: 0.32, online: true },
// Highway corridor stations (used by the charging-stop planner)
{ id: 'manesar', name: 'Manesar NH-48', area: 'Delhi–Jaipur corridor', type: 'highway', lat: 28.354, lng: 76.9366, plugs: [P('CCS2', 60, 3, 19.5), P('Type 2', 22, 1, 15)], profile: 'highway', peakUtil: 0.6, online: true },
{ id: 'neemrana', name: 'Neemrana Highway Plaza', area: 'Delhi–Jaipur corridor', type: 'highway', lat: 27.9874, lng: 76.3846, plugs: [P('CCS2', 120, 3, 22), P('CHAdeMO', 50, 1, 19)], profile: 'highway', peakUtil: 0.78, online: true },
{ id: 'shahpura', name: 'Shahpura NH-48', area: 'Delhi–Jaipur corridor', type: 'highway', lat: 27.39, lng: 75.96, plugs: [P('CCS2', 60, 3, 20)], profile: 'highway', peakUtil: 0.45, online: true },
{ id: 'pari', name: 'Pari Chowk Greater Noida', area: 'Yamuna Expressway', type: 'highway', lat: 28.4669, lng: 77.513, plugs: [P('CCS2', 60, 3, 16.5), P('Type 2', 22, 2, 13)], profile: 'highway', peakUtil: 0.5, online: true },
{ id: 'jewar', name: 'Yamuna Expwy Jewar', area: 'Yamuna Expressway', type: 'highway', lat: 28.13, lng: 77.55, plugs: [P('CCS2', 60, 3, 18.5), P('CHAdeMO', 50, 1, 17)], profile: 'highway', peakUtil: 0.55, online: true },
{ id: 'mathura', name: 'Mathura Bypass', area: 'Yamuna Expressway', type: 'highway', lat: 27.4924, lng: 77.6737, plugs: [P('CCS2', 30, 2, 17.5), P('Type 2', 22, 1, 14)], profile: 'highway', peakUtil: 0.6, online: true },
{ id: 'murthal', name: 'Murthal Food Strip', area: 'Delhi–Chandigarh corridor', type: 'highway', lat: 29.028, lng: 77.0707, plugs: [P('CCS2', 120, 4, 23), P('Type 2', 22, 2, 16)], profile: 'highway', peakUtil: 0.95, online: true },
{ id: 'karnal', name: 'Karnal NH-44', area: 'Delhi–Chandigarh corridor', type: 'highway', lat: 29.6857, lng: 76.9905, plugs: [P('CCS2', 60, 3, 18.5), P('Bharat DC-001', 15, 1, 13)], profile: 'highway', peakUtil: 0.5, online: true },
{ id: 'ambala', name: 'Ambala Cantt', area: 'Delhi–Chandigarh corridor', type: 'highway', lat: 30.3782, lng: 76.7767, plugs: [P('CCS2', 60, 3, 19)], profile: 'highway', peakUtil: 0.4, online: true }];


// Total charging points per station = sum of its connectors.
export const STATIONS: Station[] = RAW_STATIONS.map((s) => ({ ...s, points: s.plugs.reduce((a, p) => a + p.count, 0) }));

/* Hour-of-day demand multipliers (0–1). Deterministic. */
export const DEMAND_PROFILES: Record<DemandProfile, number[]> = {
  commercial: [0.08, 0.05, 0.04, 0.04, 0.05, 0.1, 0.2, 0.4, 0.62, 0.75, 0.8, 0.82, 0.85, 0.83, 0.8, 0.78, 0.82, 0.92, 1.0, 0.95, 0.8, 0.6, 0.35, 0.18],
  residential: [0.3, 0.2, 0.15, 0.12, 0.12, 0.18, 0.35, 0.55, 0.5, 0.4, 0.35, 0.35, 0.38, 0.38, 0.4, 0.45, 0.55, 0.7, 0.88, 1.0, 0.98, 0.85, 0.65, 0.45],
  highway: [0.25, 0.18, 0.15, 0.15, 0.2, 0.35, 0.55, 0.75, 0.85, 0.9, 0.92, 0.95, 0.98, 1.0, 0.97, 0.93, 0.9, 0.92, 0.95, 0.9, 0.78, 0.62, 0.45, 0.32]
};

/* Delhi NCR zones used for the network coverage insight. */
export const ZONES: Place[] = [
{ id: 'central', name: 'Central Delhi', lat: 28.635, lng: 77.215 },
{ id: 'south', name: 'South Delhi', lat: 28.54, lng: 77.22 },
{ id: 'west', name: 'West Delhi / Dwarka', lat: 28.6, lng: 77.07 },
{ id: 'north', name: 'North Delhi', lat: 28.72, lng: 77.15 },
{ id: 'east', name: 'East Delhi', lat: 28.64, lng: 77.3 },
{ id: 'noida', name: 'Noida', lat: 28.58, lng: 77.35 },
{ id: 'ghaziabad', name: 'Ghaziabad', lat: 28.67, lng: 77.43 },
{ id: 'gurugram', name: 'Gurugram', lat: 28.46, lng: 77.06 },
{ id: 'faridabad', name: 'Faridabad', lat: 28.4, lng: 77.31 }];


export const MODES: Record<ModeKey, {label: string;weights: Weights;}> = {
  balanced: { label: 'Balanced', weights: { wait: 25, price: 20, distance: 20, speed: 15, availability: 10, reserve: 10 } },
  cost: { label: 'Lowest cost', weights: { wait: 10, price: 55, distance: 15, speed: 5, availability: 5, reserve: 10 } },
  wait: { label: 'Shortest wait', weights: { wait: 50, price: 5, distance: 10, speed: 10, availability: 20, reserve: 5 } },
  fast: { label: 'Fastest charging', weights: { wait: 20, price: 5, distance: 10, speed: 50, availability: 10, reserve: 5 } }
};

export const FACTORS: Array<{key: FactorKey;label: string;better: 'low' | 'high';}> = [
{ key: 'wait', label: 'Wait', better: 'low' },
{ key: 'price', label: 'Connector price', better: 'low' },
{ key: 'distance', label: 'Distance / detour', better: 'low' },
{ key: 'speed', label: 'Charging speed', better: 'high' },
{ key: 'availability', label: 'Free plugs', better: 'high' },
{ key: 'reserve', label: 'Battery on arrival', better: 'high' }];


export const HORIZONS = [
{ label: 'Now', dh: 0 },
{ label: '+30 min', dh: 0.5 },
{ label: '+1 h', dh: 1 },
{ label: '+2 h', dh: 2 }];


export const SIM_NOTE = 'Simulated network — connector prices, plug availability and waiting times are modelled estimates, not live station data.';