import React from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { CONFIG } from '../../data/stations';
import { usePlanner } from '../../contexts/PlannerContext';
import { computeInsights } from '../../utils/demandModel';
import { fmtHour, fmtKm, fmtMin, fmtPct } from '../../utils/format';
import { Panel } from '../arcade/Panel';
import { PanelHeader } from '../arcade/PanelHeader';

export function NetworkInsights() {
  const { net, hour } = usePlanner();
  const ins = computeInsights(net);

  const simpleList = (items: Array<{key: string;name: string;meta: string;}>, empty: string) =>
  items.length ?
  <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((i) =>
    <li key={i.key} className="flex justify-between gap-2">
            <strong className="font-semibold">{i.name}</strong>
            <span className="font-mono text-xs text-muted">{i.meta}</span>
          </li>
    )}
      </ul> :

  <p className="mt-2 text-sm text-muted">{empty}</p>;


  return (
    <Panel className="p-5 sm:p-6" aria-labelledby="ins-title">
      <PanelHeader id="ins-title" title="Network insights" subtitle={`Modelled from the simulated city network at ${fmtHour(hour)}.`} />
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-accent">Less busy alternatives</h3>
          {ins.shifts.length ?
          <ul className="mt-2 space-y-3">
              {ins.shifts.map((s) =>
            <li key={s.from.id} className="rounded-md border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span>
                      <strong className="text-danger">{s.from.name}</strong>
                      <span className="ml-1 font-mono text-xs text-muted">
                        {fmtPct(s.from.util)} · ~{fmtMin(s.from.wait)}
                      </span>
                    </span>
                    <ArrowRightIcon className="h-4 w-4 text-muted" aria-hidden />
                    <span>
                      <strong className="text-go">{s.to.name}</strong>
                      <span className="ml-1 font-mono text-xs text-muted">
                        {fmtPct(s.to.util)} · ~{fmtMin(s.to.wait)}
                      </span>
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    Shares a connector type, {fmtKm(s.to.d)} apart (straight-line). Charging here instead could avoid the queue at {s.from.name}.
                  </p>
                </li>
            )}
            </ul> :

          <p className="mt-2 text-sm text-muted">No compatible, quieter alternative near a busy station right now.</p>
          }
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-danger">High demand</h3>
          {simpleList(ins.high.map((s) => ({ key: s.id, name: s.name, meta: `${fmtPct(s.util)} · ~${fmtMin(s.wait)}` })), 'No station above 80% right now.')}
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-go">Underused</h3>
          {simpleList(ins.under.map((s) => ({ key: s.id, name: s.name, meta: `${fmtPct(s.util)} · ~${fmtMin(s.wait)}` })), 'No station below 45% right now.')}
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-warn">Coverage gaps</h3>
          {simpleList(ins.gaps.map((g) => ({ key: g.zone.id, name: g.zone.name, meta: `${g.count} within ${CONFIG.coverageRadiusKm} km` })), 'Every zone has at least two stations nearby.')}
        </div>
      </div>
    </Panel>);

}