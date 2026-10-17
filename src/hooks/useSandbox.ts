import { useEffect, useMemo, useState } from 'react';
import { STATIONS } from '../data/stations';
import { usePlanner } from '../contexts/PlannerContext';
import { computeStation } from '../utils/demandModel';
import { evaluateStations, rankStations } from '../utils/recommendation';
import type { Plug, Station } from '../types/planner';

/* Builds a scenario copy of a station. Vehicle arrivals are held constant:
   peakUtil is rescaled so extra points spread the same demand over more plugs. */
function buildScenario(base: Station, extraPoints: number, priceDelta: number, forceOnline: boolean): Station {
  let plugs: Plug[] = base.plugs.map((p) => ({ ...p, price: Math.max(1, Math.round((p.price + priceDelta) * 10) / 10) }));
  if (extraPoints > 0) {
    const fastest = plugs.reduce((best, p, i) => p.kw > plugs[best].kw ? i : best, 0);
    plugs = plugs.map((p, i) => i === fastest ? { ...p, count: p.count + extraPoints } : p);
  } else if (extraPoints < 0) {
    let remove = -extraPoints;
    plugs = plugs.
    slice().
    sort((a, b) => b.count - a.count).
    map((p) => {
      const take = Math.min(remove, p.count);
      remove -= take;
      return { ...p, count: p.count - take };
    }).
    filter((p) => p.count > 0);
  }
  const points = plugs.reduce((a, p) => a + p.count, 0);
  return { ...base, plugs, points, peakUtil: base.peakUtil * base.points / points, online: base.online || forceOnline };
}

const avgPrice = (s: Station) => s.plugs.reduce((a, p) => a + p.price * p.count, 0) / s.points;

export function useSandbox() {
  const p = usePlanner();
  const [stationId, setStationId] = useState('saket');
  const [extraPoints, setExtraPoints] = useState(0);
  const [priceDelta, setPriceDelta] = useState(0);
  const [sensitivity, setSensitivity] = useState(0);
  const [forceOnline, setForceOnline] = useState(false);

  const base = STATIONS.find((s) => s.id === stationId) ?? STATIONS[0];

  useEffect(() => {
    setExtraPoints(0);
    setPriceDelta(0);
    setForceOnline(false);
  }, [stationId]);

  const scenario = useMemo(() => buildScenario(base, extraPoints, priceDelta, forceOnline), [base, extraPoints, priceDelta, forceOnline]);
  // Optional, explicit price-response assumption (elasticity). 0 = demand unaffected by price.
  const demandFactor = sensitivity > 0 ? Math.pow(avgPrice(scenario) / avgPrice(base), -sensitivity) : 1;

  const before = useMemo(() => computeStation(base, p.hour, p.demandAdj), [base, p.hour, p.demandAdj]);
  const after = useMemo(() => computeStation(scenario, p.hour, p.demandAdj, demandFactor), [scenario, p.hour, p.demandAdj, demandFactor]);

  const rankedAfter = useMemo(() => {
    const net = p.net.map((s) => s.id === stationId ? after : s);
    return rankStations(evaluateStations(net, p.ctx, p.connPick), p.weights);
  }, [p.net, p.ctx, p.connPick, p.weights, stationId, after]);

  const rankBefore = p.ranked.findIndex((r) => r.id === stationId) + 1;
  const rankAfter = rankedAfter.findIndex((r) => r.id === stationId) + 1;
  const exclusion = p.evaluated.find((e) => e.id === stationId)?.reason ?? '';

  const hourly = useMemo(
    () =>
    Array.from({ length: 24 }, (_, h) => {
      const b = computeStation(base, h, p.demandAdj);
      const a = computeStation(scenario, h, p.demandAdj, demandFactor);
      return { label: String(h).padStart(2, '0'), before: Math.round(b.wait * 10) / 10, after: Math.round(a.wait * 10) / 10 };
    }),
    [base, scenario, p.demandAdj, demandFactor]
  );

  const distribution = useMemo(
    () =>
    p.net.
    filter((s) => s.online || s.id === stationId).
    map((s) => {
      const live = s.id === stationId ? after : s;
      return { id: s.id, name: s.name, util: Math.round(live.util * 100), selected: s.id === stationId };
    }).
    sort((a, b) => b.util - a.util),
    [p.net, stationId, after]
  );

  const changed = extraPoints !== 0 || priceDelta !== 0 || sensitivity !== 0 || forceOnline;

  const reset = () => {
    setExtraPoints(0);
    setPriceDelta(0);
    setSensitivity(0);
    setForceOnline(false);
  };

  return {
    base, scenario, before, after, stationId, setStationId, extraPoints, setExtraPoints, priceDelta, setPriceDelta,
    sensitivity, setSensitivity, forceOnline, setForceOnline, demandFactor, rankBefore, rankAfter, exclusion,
    hourly, distribution, changed, reset, hour: p.hour
  };
}