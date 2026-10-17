import React from 'react';
import { CONFIG } from '../../data/stations';
import { usePlanner } from '../../contexts/PlannerContext';
import { fmtHour, fmtMin, fmtPct } from '../../utils/format';
import { Panel } from '../arcade/Panel';
import { PanelHeader } from '../arcade/PanelHeader';
import type { LiveStation } from '../../types/planner';

export function LoadBalance() {
  const { net, hour, forecastFilter, setForecastStation } = usePlanner();
  const list = net.filter((s) => s.online && (forecastFilter === 'all' || s.type === forecastFilter));
  const over = list.filter((s) => s.util >= CONFIG.overloadedUtil);
  const under = list.filter((s) => s.util < CONFIG.underusedUtil);
  const avgWait = list.length ? list.reduce((a, s) => a + s.wait, 0) / list.length : 0;

  const pills = (arr: LiveStation[], tone: 'danger' | 'go') =>
  arr.length ?
  <div className="mt-2 flex flex-wrap gap-1.5">
        {arr.map((s) =>
    <button
      key={s.id}
      type="button"
      onClick={() => setForecastStation(s.id)}
      className={`rounded border px-2 py-1 text-xs font-semibold transition-colors duration-150 ease-out ${
      tone === 'danger' ? 'border-danger/50 text-danger hover:bg-danger/10' : 'border-go/50 text-go hover:bg-go/10'}`
      }>
      
            {s.name} · {fmtPct(s.util)}
          </button>
    )}
      </div> :

  <p className="mt-2 text-xs text-muted">None at this time</p>;


  return (
    <Panel className="p-5" aria-labelledby="lb-title">
      <PanelHeader id="lb-title" title="Load balance" subtitle={`At ${fmtHour(hour)} · average est. wait ${fmtMin(avgWait)}`} />
      <div className="mt-4 space-y-4">
        <div>
          <p className="flex items-center justify-between text-sm font-semibold">
            <span>Overloaded ≥{CONFIG.overloadedUtil * 100}%</span>
            <span className="font-mono text-danger">{over.length}</span>
          </p>
          {pills(over, 'danger')}
        </div>
        <div>
          <p className="flex items-center justify-between text-sm font-semibold">
            <span>Underused &lt;{CONFIG.underusedUtil * 100}%</span>
            <span className="font-mono text-go">{under.length}</span>
          </p>
          {pills(under, 'go')}
        </div>
      </div>
    </Panel>);

}