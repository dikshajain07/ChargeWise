import React from 'react';
import { AlertTriangleIcon, CheckIcon, ClockIcon, FlagIcon, InfoIcon, MapPinIcon } from 'lucide-react';
import { CONFIG, SIM_NOTE } from '../../data/stations';
import { usePlanner } from '../../contexts/PlannerContext';
import { fmtDuration, fmtHour, fmtKm, fmtMin, fmtPrice, fmtRs, fmtWait } from '../../utils/format';
import { StatusTag } from '../arcade/StatusTag';
import { Notice } from '../arcade/Notice';

export function StopsTimeline() {
  const { ctx, plan, hour, destId } = usePlanner();
  const startName = ctx.origin.source === 'preset' ? `Preset: ${ctx.origin.name}` : 'Your location';

  if (plan.status === 'no-dest' || !ctx.dest) {
    return (
      <div className="rounded-md border border-dashed border-line p-6 text-center">
        <FlagIcon className="mx-auto h-6 w-6 text-danger" aria-hidden />
        <p className="mt-2 font-semibold">Choose a destination</p>
        <p className="mt-1 text-sm text-muted">
          {destId === 'custom' ? 'Drop a custom destination on the Stations map to get a charging plan.' : 'Set a destination to get a charging plan.'}
        </p>
      </div>);

  }

  const dest = ctx.dest;
  return (
    <div>
      {plan.status === 'ok' && !plan.stops.length &&
      <Notice tone="ok" className="mb-4">
          <strong>No charging stop needed.</strong> You should arrive with ~{Math.round(plan.arrivalPct)}%, above your {ctx.reserve}% reserve (estimate).
        </Notice>
      }
      <ol className="relative space-y-0">
        <TimelineItem marker={<MapPinIcon className="h-4 w-4" />} tone="xp">
          <h3 className="font-semibold">Start · {startName}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {ctx.battery}% battery · ~{fmtKm(ctx.remainingKm)} est. range · depart {fmtHour(hour)}
          </p>
        </TimelineItem>

        {plan.stops.map((s, i) => {
          const free = s.conn.available > 0;
          return (
            <TimelineItem key={s.station.id} marker={<span className="font-pixel text-[10px]">{i + 1}</span>} tone={free ? 'go' : 'warn'}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{s.station.name}</h3>
                {free ?
                <StatusTag tone="go" icon={<CheckIcon className="h-3 w-3" />}>
                    {s.conn.available} of {s.conn.count} {s.conn.type} free at ETA
                  </StatusTag> :

                <StatusTag tone="warn" icon={<ClockIcon className="h-3 w-3" />}>
                    All {s.conn.type} busy at ETA
                  </StatusTag>
                }
              </div>
              <p className="mt-0.5 text-sm text-muted">
                ~{fmtKm(s.legKm)} est. from {i ? 'previous stop' : 'start'} · ETA ~{fmtHour(s.eta)} · {s.conn.type} {s.conn.kw} kW · {fmtPrice(s.conn.price)}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-sm sm:grid-cols-4">
                {[
                ['Arrive with', `${Math.round(s.arrivePct)}%`],
                ['Charge to', `${s.targetPct}%`],
                ['Energy', `~${s.charge.kwh.toFixed(1)} kWh`],
                ['Est. cost', fmtRs(s.charge.cost)],
                ['Est. wait', fmtWait(s.wait)],
                ['Charge time', `~${fmtMin(s.charge.minutes)}`],
                ['Range after', `~${fmtKm(s.rangeAfter)}`],
                ['Demand at ETA', s.station.level]].
                map(([k, v]) =>
                <div key={k}>
                    <dt className="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">{k}</dt>
                    <dd className={`font-bold ${k === 'Demand at ETA' ? `st-${s.station.level} capitalize` : ''}`}>{v}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
                <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-go" aria-hidden />
                Best mix of progress, free plugs, estimated wait and {s.conn.type} price among {s.candidates} compatible station{s.candidates > 1 ? 's' : ''} in range.
              </p>
            </TimelineItem>);

        })}

        {plan.status === 'ok' ?
        <TimelineItem marker={<FlagIcon className="h-4 w-4" />} tone="go" last>
            <h3 className="font-semibold">Arrive · {dest.name}</h3>
            <p className="mt-0.5 text-sm text-muted">
              ~{fmtKm(plan.lastLeg)} final leg · arrive with ~{Math.round(plan.arrivalPct)}% · ETA ~{fmtHour(plan.arrivalHour)}
            </p>
          </TimelineItem> :

        <TimelineItem marker={<AlertTriangleIcon className="h-4 w-4" />} tone="danger" last>
            <h3 className="font-semibold text-danger">Can’t complete this trip on the current network</h3>
            <p className="mt-0.5 text-sm text-muted">
              {ctx.connectors.length ?
            `No compatible station is reachable ${plan.stops.length ? 'after the last stop' : 'from the start'} that also brings you closer to ${dest.name}. Try a higher battery, a lower reserve, a higher charge limit, or add another connector your EV supports.` :
            'Select at least one connector your EV supports.'}
            </p>
          </TimelineItem>
        }
      </ol>

      {plan.stops.length > 0 &&
      <dl className="mt-5 grid gap-4 rounded-md border border-line p-4 sm:grid-cols-3">
          <div>
            <dt className="cw-label">Total charging cost</dt>
            <dd className="mt-1 font-mono text-lg font-bold">{fmtRs(plan.totals.cost)}</dd>
          </div>
          <div>
            <dt className="cw-label">Wait + charging</dt>
            <dd className="mt-1 font-mono text-lg font-bold">{fmtDuration(plan.totals.wait + plan.totals.charge)}</dd>
          </div>
          <div>
            <dt className="cw-label">Est. trip time</dt>
            <dd className="mt-1 font-mono text-lg font-bold">{fmtDuration(plan.totals.timeMin)}</dd>
          </div>
        </dl>
      }

      {plan.skipped.length > 0 &&
      <div className="mt-4 rounded-md border border-warn/40 bg-warn/5 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-warn">Avoided stops</h4>
          <ul className="mt-2 space-y-1 text-sm">
            {plan.skipped.map((k) =>
          <li key={k.id}>
                <strong>{k.name}</strong> — <span className="text-muted">{k.why}</span>
              </li>
          )}
          </ul>
        </div>
      }

      <p className="mt-4 flex items-start gap-1.5 text-xs text-muted">
        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Stops are chosen by straight-line distance × {ctx.rf}, an average {CONFIG.avgSpeedKmh} km/h and simulated plug availability at your estimated arrival time. Costs use each
        stop’s connector price. This is not a calculated driving route. {SIM_NOTE}
      </p>
    </div>);

}

const MARKER_TONE = {
  xp: 'border-xp text-xp',
  go: 'border-go text-go',
  warn: 'border-warn text-warn',
  danger: 'border-danger text-danger'
};

function TimelineItem({ marker, tone, last = false, children }: {marker: React.ReactNode;tone: keyof typeof MARKER_TONE;last?: boolean;children: React.ReactNode;}) {
  return (
    <li className="relative flex gap-4 pb-6">
      {!last && <span aria-hidden className="absolute left-[17px] top-9 bottom-0 w-0.5 bg-line" />}
      <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 bg-surface ${MARKER_TONE[tone]}`} aria-hidden>
        {marker}
      </span>
      <div className="min-w-0 flex-1 pt-1">{children}</div>
    </li>);

}