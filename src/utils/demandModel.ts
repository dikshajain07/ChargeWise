import { CONFIG, DEMAND_PROFILES, HORIZONS, STATIONS, ZONES } from '../data/stations';
import type { DemandLevel, DemandProfile, LatLng, LiveStation, Place, Station, StationStatus } from '../types/planner';

/* Distance: straight-line (Haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* Estimated distance = straight-line × road factor (an assumption, not routing). */
export function estKm(a: LatLng, b: LatLng, rf: number): number {
  return haversineKm(a, b) * rf;
}

export function demandCurve(profile: DemandProfile, hour: number): number {
  const c = DEMAND_PROFILES[profile];
  const h = (hour % 24 + 24) % 24;
  const i = Math.floor(h);
  const f = h - i;
  return c[i] * (1 - f) + c[(i + 1) % 24] * f;
}

/* Multi-server queue approximation (Sakasegawa) for average wait in minutes.
   Beyond 90% utilisation a backlog term represents queues forming. */
export function queueWait(util: number, c: number, svcMin: number): number {
  if (util <= 0) return 0;
  const rho = Math.min(util, 0.9);
  let w = svcMin * Math.pow(rho, Math.sqrt(2 * (c + 1)) - 1) / (c * (1 - rho));
  if (util > 0.9) w += (util - 0.9) * svcMin * 3;
  return Math.min(w, 120);
}

export function levelOf(util: number): Exclude<DemandLevel, 'offline'> {
  if (util < 0.5) return 'low';
  if (util < 0.8) return 'medium';
  return 'high';
}

export function statusOf(st: Station, util: number): StationStatus {
  if (!st.online) return 'Offline';
  if (util >= 0.95) return 'Queue forming';
  if (util >= 0.8) return 'Busy';
  return 'Available';
}

/* Station state at a given hour, including per-connector free plugs and wait.
   demandFactor is an extra multiplier used only by Sandbox scenarios (default 1). */
export function computeStation(st: Station, hour: number, demandAdj: number, demandFactor = 1): LiveStation {
  const maxKw = Math.max(...st.plugs.map((p) => p.kw));
  const svcMin = CONFIG.sessionKwh / (maxKw * CONFIG.chargerEfficiency) * 60;
  const baseArrivals = st.peakUtil * st.points * 60 / svcMin; // vehicles/hour at peak
  const arrivals = baseArrivals * demandCurve(st.profile, hour) * (1 + demandAdj / 100) * demandFactor;
  const util = st.online ? arrivals * svcMin / 60 / st.points : 0;
  const wait = st.online ? queueWait(util, st.points, svcMin) : 0;
  const queue = st.online ? arrivals / 60 * wait : 0; // Little's law
  const busyShare = Math.min(1, util);
  const connectors = st.plugs.map((p) => {
    const busy = st.online ? Math.min(p.count, Math.round(busyShare * p.count)) : p.count;
    const available = st.online ? p.count - busy : 0;
    const plugSvc = CONFIG.sessionKwh / (p.kw * CONFIG.chargerEfficiency) * 60;
    const plugWait = !st.online ? null : available > 0 ? 0 : Math.min(120, Math.max(wait, plugSvc / (2 * p.count)));
    return { ...p, available, busy, wait: plugWait, fast: p.kw >= 25 };
  });
  return {
    ...st,
    maxKw,
    fast: maxKw >= 25,
    svcMin,
    arrivals,
    util,
    wait,
    queue,
    connectors,
    level: st.online ? levelOf(util) : 'offline',
    status: statusOf(st, util)
  };
}

export function computeNetwork(hour: number, demandAdj: number, stations: Station[] = STATIONS): LiveStation[] {
  return stations.map((s) => computeStation(s, hour, demandAdj));
}

export type ForecastPoint = LiveStation & {horizon: string;};

export function forecastStation(st: Station, hour: number, demandAdj: number): ForecastPoint[] {
  return HORIZONS.map((h) => ({ horizon: h.label, ...computeStation(st, hour + h.dh, demandAdj) }));
}

export interface NetworkInsights {
  high: LiveStation[];
  under: LiveStation[];
  gaps: Array<{zone: Place;count: number;}>;
  shifts: Array<{from: LiveStation;to: LiveStation & {d: number;};}>;
}

export function computeInsights(net: LiveStation[]): NetworkInsights {
  const city = net.filter((s) => s.type === 'city' && s.online);
  const high = city.filter((s) => s.util >= 0.8).sort((a, b) => b.util - a.util);
  const under = city.filter((s) => s.util < CONFIG.underusedUtil).sort((a, b) => a.util - b.util);
  const coverage = ZONES.map((z) => ({
    zone: z,
    count: net.filter((s) => s.online && haversineKm(z, s) <= CONFIG.coverageRadiusKm).length
  })).sort((a, b) => a.count - b.count);
  const gaps = coverage.filter((c) => c.count <= 1);
  const shifts: NetworkInsights['shifts'] = [];
  high.forEach((h) => {
    const types = h.plugs.map((p) => p.type);
    const alt = under.
    filter((u) => u.plugs.some((p) => types.indexOf(p.type) !== -1)).
    map((u) => ({ ...u, d: haversineKm(h, u) })).
    filter((u) => u.d <= 12 && h.wait - u.wait >= 5).
    sort((a, b) => a.d - b.d)[0];
    if (alt) shifts.push({ from: h, to: alt });
  });
  return { high, under, gaps, shifts };
}