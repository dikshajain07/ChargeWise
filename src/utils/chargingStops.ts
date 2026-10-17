import { CONFIG, STATIONS } from '../data/stations';
import type { ConnPick, LatLng, PlanResult, PlanStop, SkippedStop, TripContext } from '../types/planner';
import { computeStation, estKm } from './demandModel';
import { clamp, fmtMin, fmtPct, fmtPrice } from './format';
import { chargeEstimate, hasCompatiblePlug, pickConnector } from './recommendation';

export interface StopOptions {
  hour: number;
  demandAdj: number;
  chargeCap: number;
  avoidCongested: boolean;
  connPick: ConnPick;
}

/* Charging-stop planning (simplified): greedy stop selection by progress,
   wait and connector price, using simulated availability at the ETA. */
export function planChargingStops(ctx: TripContext, opts: StopOptions): PlanResult {
  const dest = ctx.dest;
  if (!dest) return { status: 'no-dest' };
  const rf = ctx.rf;
  const totalKm = estKm(ctx.origin, dest, rf);
  let pos: LatLng = { lat: ctx.origin.lat, lng: ctx.origin.lng };
  let pct = ctx.battery;
  let hour = opts.hour;
  const used: Record<string, boolean> = {};
  const stops: PlanStop[] = [];
  const skipped: SkippedStop[] = [];

  const finishPlan = (status: 'ok' | 'partial' | 'fail'): PlanResult => {
    const lastLeg = estKm(pos, dest, rf);
    const arrivalPct = pct - lastLeg / ctx.range * 100;
    const driveKm = stops.reduce((a, s) => a + s.legKm, 0) + lastLeg;
    const cost = stops.reduce((a, s) => a + s.charge.cost, 0);
    const wait = stops.reduce((a, s) => a + s.wait, 0);
    const charge = stops.reduce((a, s) => a + s.charge.minutes, 0);
    const timeMin = driveKm / CONFIG.avgSpeedKmh * 60 + wait + charge;
    return {
      status,
      totalKm,
      stops,
      skipped,
      lastLeg,
      arrivalPct,
      totals: { cost, wait, charge, driveKm, timeMin },
      arrivalHour: hour + lastLeg / CONFIG.avgSpeedKmh,
      nextPos: pos
    };
  };

  for (let i = 0; i < 5; i++) {
    const toDest = estKm(pos, dest, rf);
    const arriveDirect = pct - toDest / ctx.range * 100;
    if (arriveDirect >= ctx.reserve) return finishPlan('ok');

    const cands = STATIONS.filter((s) => s.online && !used[s.id] && hasCompatiblePlug(s, ctx.connectors)).
    map((s) => {
      const d = estKm(pos, s, rf);
      const remain = estKm(s, dest, rf);
      const arrive = pct - d / ctx.range * 100;
      const eta = hour + d / CONFIG.avgSpeedKmh;
      const live = computeStation(s, eta, opts.demandAdj);
      const conn = pickConnector(live, ctx.connectors, opts.connPick).chosen!;
      return { s, d, remain, arrive, eta, live, conn, busy: false, congested: false, score: 0 };
    }).
    filter((c) => c.arrive >= ctx.reserve && c.remain < toDest - 5 && c.d + c.remain - toDest <= Math.max(12, toDest * 0.2));
    if (!cands.length) return finishPlan(stops.length ? 'partial' : 'fail');

    const waits = cands.map((c) => c.conn.wait as number);
    const prices = cands.map((c) => c.conn.price);
    const progs = cands.map((c) => toDest - c.remain);
    const norm = (v: number, arr: number[]) => {
      const mn = Math.min(...arr);
      const mx = Math.max(...arr);
      return mx === mn ? 0 : (v - mn) / (mx - mn);
    };
    cands.forEach((c) => {
      c.busy = c.conn.available === 0;
      c.congested = c.busy || c.live.util >= CONFIG.overloadedUtil;
      c.score =
      0.45 * norm(toDest - c.remain, progs) +
      0.3 * (1 - norm(c.conn.wait as number, waits)) +
      0.25 * (1 - norm(c.conn.price, prices)) - (
      opts.avoidCongested && c.congested ? 0.35 : 0);
    });
    cands.sort((a, b) => b.score - a.score);
    const best = cands[0];
    cands.slice(1).forEach((c) => {
      if (toDest - c.remain > toDest - best.remain - 2 && skipped.length < 3 && !skipped.some((k) => k.id === c.s.id)) {
        if (c.busy) skipped.push({ id: c.s.id, name: c.s.name, why: 'all compatible ' + c.conn.type + ' plugs busy at arrival (~' + fmtMin(c.conn.wait) + ' wait)' });else
        if (c.congested) skipped.push({ id: c.s.id, name: c.s.name, why: 'high estimated demand at arrival (' + fmtPct(c.live.util) + ')' });else
        if (c.conn.price - best.conn.price >= 2)
        skipped.push({ id: c.s.id, name: c.s.name, why: 'pricier ' + c.conn.type + ' at ' + fmtPrice(c.conn.price) + ' (₹' + (c.conn.price - best.conn.price).toFixed(1).replace('.0', '') + ' more)' });
      }
    });

    const needPct = best.remain / ctx.range * 100 + ctx.reserve + 5;
    const target = Math.round(clamp(Math.max(needPct, best.arrive + 10), 0, opts.chargeCap));
    const charge = chargeEstimate(best.arrive, target, ctx.capacity, best.conn.price, best.conn.kw);
    used[best.s.id] = true;
    const wait = best.conn.wait as number;
    stops.push({
      station: best.live,
      conn: best.conn,
      legKm: best.d,
      arrivePct: best.arrive,
      targetPct: target,
      charge,
      wait,
      eta: best.eta,
      rangeAfter: target / 100 * ctx.range,
      candidates: cands.length
    });
    hour = best.eta + (wait + charge.minutes) / 60;
    pos = { lat: best.s.lat, lng: best.s.lng };
    pct = target;
  }
  return finishPlan('partial');
}