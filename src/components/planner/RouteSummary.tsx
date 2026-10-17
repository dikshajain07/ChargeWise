import React from 'react';
import { ArrowRightIcon, FlagIcon, MapPinIcon } from 'lucide-react';
import { usePlanner } from '../../contexts/PlannerContext';
import { CONFIG } from '../../data/stations';
import { fmtDuration, fmtKm, fmtMin, fmtRs } from '../../utils/format';
import { Panel } from '../arcade/Panel';
import { HudStat } from '../arcade/HudStat';
import { StatusTag } from '../arcade/StatusTag';

export function RouteSummary() {
  const { ctx, plan } = usePlanner();
  const startName = ctx.origin.source === 'preset' ? ctx.origin.name : 'Your location';

  if (plan.status === 'no-dest' || !ctx.dest) {
    return (
      <Panel className="flex flex-wrap items-center gap-3 p-5">
        <MapPinIcon className="h-4 w-4 text-xp" aria-hidden />
        <span className="font-semibold">{startName}</span>
        <span className="text-sm text-muted">— choose a destination to build a charging plan.</span>
      </Panel>);

  }

  const ok = plan.status === 'ok';
  const driveMin = plan.totals.driveKm / CONFIG.avgSpeedKmh * 60;
  const direct = ctx.battery - plan.totalKm / ctx.range * 100;

  return (
    <Panel tone={ok ? 'go' : 'danger'} className="p-5 sm:p-6" aria-label="Route summary">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <MapPinIcon className="h-4 w-4 text-xp" aria-hidden />
          {startName}
        </span>
        <ArrowRightIcon className="h-4 w-4 text-muted" aria-hidden />
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <FlagIcon className="h-4 w-4 text-danger" aria-hidden />
          {ctx.dest.name}
        </span>
        <span className="ml-auto">
          {ok ? <StatusTag tone="go">Feasible plan</StatusTag> : <StatusTag tone="danger">Plan incomplete</StatusTag>}
        </span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        <HudStat label="Est. distance" value={fmtKm(plan.totalKm)} hint={`straight-line × ${ctx.rf}`} />
        <HudStat label="Drive time" value={fmtDuration(driveMin)} hint={`at ${CONFIG.avgSpeedKmh} km/h avg`} />
        <HudStat label="Charging" value={plan.stops.length ? fmtDuration(plan.totals.charge) : '—'} hint={`${plan.stops.length} stop${plan.stops.length === 1 ? '' : 's'}`} />
        <HudStat label="Waiting" value={plan.stops.length ? fmtMin(plan.totals.wait) : '—'} hint="simulated" tone={plan.totals.wait > 0 ? 'warn' : 'ink'} />
        <HudStat label="Charging cost" value={fmtRs(plan.totals.cost)} hint="connector prices" />
        <HudStat
          label={ok ? 'Arrive with' : 'Without charging'}
          value={ok ? `${Math.round(plan.arrivalPct)}%` : direct >= ctx.reserve ? `${Math.round(direct)}%` : 'Short'}
          hint={`reserve ${ctx.reserve}%`}
          tone={ok ? 'go' : 'danger'} />
        
      </dl>
    </Panel>);

}