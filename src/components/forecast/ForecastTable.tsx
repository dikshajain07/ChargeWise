import React from 'react';
import { HORIZONS, STATIONS } from '../../data/stations';
import { usePlanner } from '../../contexts/PlannerContext';
import { forecastStation } from '../../utils/demandModel';
import { fmtHour, fmtMin, fmtPct } from '../../utils/format';

const BAR = { low: 'bg-go', medium: 'bg-warn', high: 'bg-danger', offline: 'bg-line' };

export function ForecastTable() {
  const { hour, demandAdj, forecastFilter, forecastStation: selected, setForecastStation } = usePlanner();
  const list = STATIONS.filter((s) => forecastFilter === 'all' || s.type === forecastFilter);
  const rows = list.map((s) => ({ s, fc: forecastStation(s, hour, demandAdj) })).sort((a, b) => b.fc[0].util - a.fc[0].util);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Estimated utilisation by station over the next two hours (simulated)</caption>
        <thead>
          <tr className="text-muted">
            <th scope="col" className="py-2 pr-3 text-[11px] font-semibold uppercase tracking-wide">Station</th>
            {HORIZONS.map((h) =>
            <th key={h.label} scope="col" className="py-2 pr-3 text-[11px] font-semibold uppercase tracking-wide">
                {h.label}
                <span className="block font-mono text-[10px] font-normal normal-case">{fmtHour(hour + h.dh)}</span>
              </th>
            )}
            <th scope="col" className="py-2 text-[11px] font-semibold uppercase tracking-wide">Wait now → +2 h</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ s, fc }) => {
            const sel = s.id === selected;
            return (
              <tr
                key={s.id}
                tabIndex={0}
                aria-selected={sel}
                onClick={() => setForecastStation(s.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setForecastStation(s.id);
                  }
                }}
                className={`cursor-pointer border-t border-line transition-colors duration-150 ease-out hover:bg-accent/5 ${sel ? 'bg-accent/10' : ''}`}>
                
                <th scope="row" className="py-2.5 pr-3 font-normal">
                  <span className={`block font-semibold ${sel ? 'text-accent' : ''}`}>{s.name}</span>
                  <span className="block text-xs text-muted">
                    {s.area} · {s.points} plugs · {fc[0].fast ? 'DC' : 'AC'}
                  </span>
                </th>
                {!s.online ?
                <td colSpan={5} className="py-2.5 text-xs text-muted">
                    Offline — simulated maintenance
                  </td> :

                <>
                    {fc.map((f) =>
                  <td key={f.horizon} className="py-2.5 pr-3">
                        <div className="h-1.5 w-full max-w-[90px] rounded-full bg-line/60">
                          <div className={`h-full rounded-full ${BAR[f.level]}`} style={{ width: `${Math.min(100, f.util / 1.2 * 100)}%` }} />
                        </div>
                        <span className={`mt-1 block font-mono text-xs font-bold st-${f.level}`}>{fmtPct(f.util)}</span>
                      </td>
                  )}
                    <td className="py-2.5 font-mono text-xs">
                      {fmtMin(fc[0].wait)} <span className="text-muted">→</span> {fmtMin(fc[3].wait)}
                    </td>
                  </>
                }
              </tr>);

          })}
        </tbody>
      </table>
    </div>);

}