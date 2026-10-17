import React, { useState } from 'react';
import { usePlanner } from '../../contexts/PlannerContext';
import { fmtKm, fmtMin, fmtPrice } from '../../utils/format';
import { Panel } from '../arcade/Panel';
import { PanelHeader } from '../arcade/PanelHeader';
import { SegmentedControl } from '../arcade/SegmentedControl';

type Tab = 'reachable' | 'excluded';

export function ReachList() {
  const { evaluated, focusStation } = usePlanner();
  const [tab, setTab] = useState<Tab>('reachable');
  const ok = evaluated.filter((e) => e.reachable).sort((a, b) => Number(b.free) - Number(a.free) || a.estDist - b.estDist);
  const no = evaluated.filter((e) => !e.reachable).sort((a, b) => a.estDist - b.estDist);
  const list = tab === 'reachable' ? ok : no;

  return (
    <Panel className="p-5" aria-labelledby="reach-title">
      <PanelHeader id="reach-title" title="Reachability" subtitle="Battery, reserve, connector compatibility and estimated distance." />
      <div className="mt-4">
        <SegmentedControl<Tab>
          size="sm"
          ariaLabel="Station list"
          value={tab}
          onChange={setTab}
          options={[
          { value: 'reachable', label: `Reachable (${ok.length})` },
          { value: 'excluded', label: `Excluded (${no.length})` }]
          } />
        
      </div>
      {list.length === 0 ?
      <p className="mt-4 rounded-md border border-dashed border-line p-4 text-sm text-muted">
          {tab === 'reachable' ? 'No compatible station is within your usable range above the reserve.' : 'Every station is reachable and compatible with your current settings.'}
        </p> :

      <ul className="mt-3 max-h-[520px] divide-y divide-line overflow-y-auto pr-1">
          {list.map((e) =>
        <li key={e.id}>
              <button
            type="button"
            onClick={() => focusStation(e.id)}
            className="flex w-full items-center gap-3 rounded px-1 py-2.5 text-left transition-colors duration-150 ease-out hover:bg-accent/5">
            
                <span
              aria-hidden
              className={`h-2.5 w-2.5 shrink-0 rotate-45 rounded-[2px] ${e.reachable ? e.free ? 'bg-go' : 'bg-warn' : 'bg-danger/70'}`} />
            
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{e.name}</span>
                  <span className={`block text-xs ${e.reachable ? 'text-muted' : 'text-danger'}`}>
                    {e.reachable && e.conn ?
                `${e.conn.type} ${e.vehicleKw} kW · ${e.free ? `${e.conn.available}/${e.conn.count} free` : `busy · ~${fmtMin(e.cWait)}`} · ${fmtPrice(e.cPrice)}` :
                e.reason}
                  </span>
                </span>
                <span className="shrink-0 text-right font-mono text-xs">
                  {fmtKm(e.estDist)}
                  <span className="block text-[10px] text-muted">est.</span>
                </span>
              </button>
            </li>
        )}
        </ul>
      }
    </Panel>);

}