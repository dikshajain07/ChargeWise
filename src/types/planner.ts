export type ConnectorTypeId = 'CCS2' | 'Type 2' | 'CHAdeMO' | 'Bharat DC-001' | 'Bharat AC-001';
export type ConnectorKind = 'AC' | 'DC';

export interface ConnectorTypeDef {
  id: ConnectorTypeId;
  kind: ConnectorKind;
}

export type DemandProfile = 'commercial' | 'residential' | 'highway';
export type StationType = 'city' | 'highway';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Plug {
  type: ConnectorTypeId;
  kw: number;
  count: number;
  price: number;
}

export interface Station extends LatLng {
  id: string;
  name: string;
  area: string;
  type: StationType;
  plugs: Plug[];
  profile: DemandProfile;
  peakUtil: number;
  online: boolean;
  points: number;
}

export type DemandLevel = 'low' | 'medium' | 'high' | 'offline';
export type StationStatus = 'Offline' | 'Queue forming' | 'Busy' | 'Available';

export interface LiveConnector extends Plug {
  available: number;
  busy: number;
  wait: number | null;
  fast: boolean;
}

export interface LiveStation extends Station {
  maxKw: number;
  fast: boolean;
  svcMin: number;
  arrivals: number;
  util: number;
  wait: number;
  queue: number;
  connectors: LiveConnector[];
  level: DemandLevel;
  status: StationStatus;
}

export interface Place extends LatLng {
  id: string;
  name: string;
}

export type OriginSource = 'preset' | 'gps';

export interface Origin extends Place {
  source: OriginSource;
  accuracy: number | null;
}

export interface Destination extends LatLng {
  name: string;
}

export interface DestinationOption {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
}

export interface TripContext {
  origin: Origin;
  dest: Destination | null;
  battery: number;
  range: number;
  reserve: number;
  connectors: ConnectorTypeId[];
  rf: number;
  capacity: number;
  remainingKm: number;
  reserveKm: number;
  usableKm: number;
}

export interface ChargeEstimate {
  fromPct: number;
  toPct: number;
  kwh: number;
  price: number;
  cost: number;
  minutes: number;
}

export interface EvaluatedStation extends LiveStation {
  straightKm: number;
  estDist: number;
  arrivalPct: number;
  detourKm: number | null;
  conn: LiveConnector | null;
  compat: LiveConnector[];
  pinned: boolean;
  availCompat: number;
  totalCompat: number;
  compatible: boolean;
  free: boolean;
  vehicleKw: number;
  cPrice: number;
  cWait: number | null;
  distMetric: number;
  reachable: boolean;
  reason: string;
  charge: ChargeEstimate;
}

export type FactorKey = 'wait' | 'price' | 'distance' | 'speed' | 'availability' | 'reserve';
export type Weights = Record<FactorKey, number>;

export interface RankedStation extends EvaluatedStation {
  conn: LiveConnector;
  norms: Record<FactorKey, number>;
  score: number;
  ranges: Record<FactorKey, {min: number;max: number;}>;
}

export type ModeKey = 'balanced' | 'cost' | 'wait' | 'fast';

export interface Explanation {
  type: 'pro' | 'con';
  text: string;
}

export interface PlanStop {
  station: LiveStation;
  conn: LiveConnector;
  legKm: number;
  arrivePct: number;
  targetPct: number;
  charge: ChargeEstimate;
  wait: number;
  eta: number;
  rangeAfter: number;
  candidates: number;
}

export interface SkippedStop {
  id: string;
  name: string;
  why: string;
}

export interface ChargingPlan {
  status: 'ok' | 'partial' | 'fail';
  totalKm: number;
  stops: PlanStop[];
  skipped: SkippedStop[];
  lastLeg: number;
  arrivalPct: number;
  totals: {cost: number;wait: number;charge: number;driveKm: number;timeMin: number;};
  arrivalHour: number;
  nextPos: LatLng;
}

export type PlanResult = ChargingPlan | {status: 'no-dest';};

export type ConnPick = Partial<Record<string, ConnectorTypeId>>;