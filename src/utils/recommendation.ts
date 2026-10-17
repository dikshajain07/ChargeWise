import { CONFIG, DESTINATIONS, FACTORS } from '../data/stations';
import type {
  ConnectorTypeId,
  ConnPick,
  ChargeEstimate,
  Destination,
  EvaluatedStation,
  Explanation,
  FactorKey,
  LiveConnector,
  LiveStation,
  Origin,
  RankedStation,
  Station,
  TripContext,
  Weights } from
'../types/planner';
import { estKm, haversineKm } from './demandModel';
import { fmtKm, fmtMin, fmtPrice } from './format';

/* ---------- Trip context ---------- */
export interface ContextInput {
  origin: Origin;
  dest: Destination | null;
  battery: number;
  range: number;
  reserve: number;
  connectors: ConnectorTypeId[];
  roadFactor: number;
  /* Known battery capacity (kWh). When absent the original assumption range × 0.15 is used. */
  capacityKwh: number | null;
}

export function getDestination(destId: string, customDest: Destination | null): Destination | null {
  if (destId === 'none') return null;
  if (destId === 'custom') return customDest;
  const d = DESTINATIONS.find((x) => x.id === destId);
  return d && d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng, name: d.name } : null;
}

export function buildContext(i: ContextInput): TripContext {
  const capacity = i.capacityKwh ?? i.range * CONFIG.energyPerKm;
  const remainingKm = i.range * i.battery / 100;
  const reserveKm = i.range * i.reserve / 100;
  return {
    origin: i.origin,
    dest: i.dest,
    battery: i.battery,
    range: i.range,
    reserve: i.reserve,
    connectors: i.connectors.slice(),
    rf: i.roadFactor,
    capacity,
    remainingKm,
    reserveKm,
    usableKm: Math.max(0, remainingKm - reserveKm)
  };
}

/* ---------- Connector compatibility ---------- */
/* The driver's chosen compatible connector if set, otherwise the best match —
   a free plug first, then the fastest, then the cheapest. */
export function pickConnector(live: LiveStation, connectors: ConnectorTypeId[], connPick: ConnPick) {
  const compat = live.connectors.filter((c) => connectors.indexOf(c.type) !== -1);
  const availCompat = compat.reduce((a, c) => a + c.available, 0);
  const totalCompat = compat.reduce((a, c) => a + c.count, 0);
  if (!compat.length) return { compat, chosen: null as LiveConnector | null, pinned: false, availCompat, totalCompat };
  const sorted = compat.
  slice().
  sort((a, b) => Number(b.available > 0) - Number(a.available > 0) || b.kw - a.kw || a.price - b.price);
  const pin = compat.find((c) => c.type === connPick[live.id]);
  return { compat, chosen: (pin || sorted[0]) as LiveConnector | null, pinned: !!pin, availCompat, totalCompat };
}

export function hasCompatiblePlug(st: Station, connectors: ConnectorTypeId[]): boolean {
  return st.plugs.some((p) => connectors.indexOf(p.type) !== -1);
}

/* Energy and cost for a charge, priced with the selected connector's ₹/kWh. */
export function chargeEstimate(fromPct: number, toPct: number, capacity: number, price: number, kw: number): ChargeEstimate {
  const pct = Math.max(0, toPct - fromPct);
  const batteryKwh = pct / 100 * capacity;
  const gridKwh = batteryKwh / CONFIG.chargeEfficiency;
  const minutes = kw > 0 ? batteryKwh / (kw * CONFIG.chargerEfficiency) * 60 : 0;
  return { fromPct, toPct, kwh: gridKwh, price, cost: gridKwh * price, minutes };
}

/* ---------- Reachability ---------- */
export function evaluateStations(net: LiveStation[], ctx: TripContext, connPick: ConnPick): EvaluatedStation[] {
  const directKm = ctx.dest ? estKm(ctx.origin, ctx.dest, ctx.rf) : 0;
  return net.map((s) => {
    const straightKm = haversineKm(ctx.origin, s);
    const estDist = straightKm * ctx.rf;
    const pk = pickConnector(s, ctx.connectors, connPick);
    const conn = pk.chosen;
    const arrivalPct = ctx.battery - estDist / ctx.range * 100;
    const detourKm = ctx.dest ? Math.max(0, estDist + estKm(s, ctx.dest, ctx.rf) - directKm) : null;
    let reason = '';
    if (!s.online) reason = 'Offline — under maintenance (simulated status).';else
    if (!ctx.connectors.length) reason = 'Select at least one connector your EV supports.';else
    if (!conn) reason = 'Not compatible — offers ' + s.plugs.map((p) => p.type).join(', ') + '; your EV supports ' + ctx.connectors.join(', ') + '.';else
    if (estDist > ctx.remainingKm) reason = 'Out of range — needs ~' + fmtKm(estDist) + ', only ~' + fmtKm(ctx.remainingKm) + ' of range left.';else
    if (arrivalPct < ctx.reserve) reason = 'Breaks your ' + ctx.reserve + '% reserve — you would arrive with ~' + Math.max(0, Math.round(arrivalPct)) + '%.';
    const target = Math.max(CONFIG.targetPct, Math.round(arrivalPct));
    return {
      ...s,
      straightKm,
      estDist,
      arrivalPct,
      detourKm,
      conn,
      compat: pk.compat,
      pinned: pk.pinned,
      availCompat: pk.availCompat,
      totalCompat: pk.totalCompat,
      compatible: !!conn,
      free: !!conn && conn.available > 0,
      vehicleKw: conn ? conn.kw : 0,
      cPrice: conn ? conn.price : 0,
      cWait: conn ? conn.wait : null,
      distMetric: ctx.dest ? detourKm as number : estDist,
      reachable: !reason,
      reason,
      charge: chargeEstimate(arrivalPct, target, ctx.capacity, conn ? conn.price : 0, conn ? conn.kw : 0)
    };
  });
}

/* ---------- Ranking (transparent weighted score) ----------
   Compatible stations with a free plug are listed before busy ones;
   within each group, stations are ordered by score. */
const FACTOR_VALUE: Record<FactorKey, (e: EvaluatedStation) => number> = {
  wait: (e) => e.cWait as number,
  price: (e) => e.cPrice,
  distance: (e) => e.distMetric,
  speed: (e) => e.vehicleKw,
  availability: (e) => e.totalCompat ? e.availCompat / e.totalCompat : 0,
  reserve: (e) => e.arrivalPct
};

export function rankStations(evaluated: EvaluatedStation[], weights: Weights): RankedStation[] {
  const cands = evaluated.filter((e) => e.reachable);
  if (!cands.length) return [];
  const ranges = {} as Record<FactorKey, {min: number;max: number;}>;
  FACTORS.forEach((f) => {
    const vals = cands.map(FACTOR_VALUE[f.key]);
    ranges[f.key] = { min: Math.min(...vals), max: Math.max(...vals) };
  });
  const totalW = FACTORS.reduce((a, f) => a + (weights[f.key] || 0), 0) || 1;
  return cands.
  map((e) => {
    const norms = {} as Record<FactorKey, number>;
    let score = 0;
    FACTORS.forEach((f) => {
      const r = ranges[f.key];
      const v = FACTOR_VALUE[f.key](e);
      let n = r.max === r.min ? 1 : (v - r.min) / (r.max - r.min);
      if (f.better === 'low') n = r.max === r.min ? 1 : 1 - n;
      norms[f.key] = n;
      score += (weights[f.key] || 0) * n;
    });
    return { ...e, conn: e.conn as LiveConnector, norms, score: score / totalW * 100, ranges };
  }).
  sort((a, b) => Number(b.free) - Number(a.free) || b.score - a.score || a.estDist - b.estDist);
}

export function explainRecommendation(r: RankedStation, weights: Weights, hasDest: boolean): Explanation[] {
  const type = r.conn.type;
  const wait = r.cWait as number;
  const pros: Record<FactorKey, () => string> = {
    wait: () => wait === 0 ? 'No wait — a compatible ' + type + ' plug is free' : (wait === r.ranges.wait.min ? 'Shortest estimated wait' : 'Short estimated wait') + ' (~' + fmtMin(wait) + ')',
    price: () => (r.cPrice === r.ranges.price.min ? 'Cheapest compatible connector' : 'Competitive connector price') + ' at ' + fmtPrice(r.cPrice) + ' (' + type + ')',
    distance: () => hasDest ? 'Small detour of ~' + fmtKm(r.detourKm ?? 0) + ' on the way' : 'Close by — ~' + fmtKm(r.estDist) + ' est.',
    speed: () => (r.conn.fast ? 'Fast ' : '') + r.vehicleKw + ' kW ' + type + ' charging',
    availability: () => r.availCompat + ' of ' + r.totalCompat + ' compatible plugs free',
    reserve: () => 'Arrive with a healthy ~' + Math.round(r.arrivalPct) + '% battery'
  };
  const cons: Record<FactorKey, () => string> = {
    wait: () => 'longer estimated wait (~' + fmtMin(wait) + ')',
    price: () => 'higher price (' + fmtPrice(r.cPrice) + ' for ' + type + ')',
    distance: () => hasDest ? 'larger detour (~' + fmtKm(r.detourKm ?? 0) + ')' : 'further away (~' + fmtKm(r.estDist) + ')',
    speed: () => 'slower ' + r.vehicleKw + ' kW charging',
    availability: () => r.availCompat ? 'only ' + r.availCompat + ' of ' + r.totalCompat + ' compatible plugs free' : 'all compatible plugs busy right now',
    reserve: () => 'lower battery on arrival (~' + Math.round(r.arrivalPct) + '%)'
  };
  const contrib = FACTORS.map((f) => ({ key: f.key, w: weights[f.key] || 0, n: r.norms[f.key] })).filter((c) => c.w > 0);
  const top = contrib.
  slice().
  sort((a, b) => b.w * b.n - a.w * a.n).
  filter((c) => c.n >= 0.6).
  slice(0, 2);
  const out: Explanation[] = top.map((c) => ({ type: 'pro', text: pros[c.key]() }));
  if (!out.length) out.push({ type: 'pro', text: 'Best overall balance among reachable compatible stations for your weights' });
  const weak = contrib.filter((c) => c.w >= 10 && c.n < 0.35).sort((a, b) => b.w - a.w)[0];
  if (weak) out.push({ type: 'con', text: 'Trade-off: ' + cons[weak.key]() });
  return out;
}