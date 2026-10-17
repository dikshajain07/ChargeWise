import React from 'react';
import { CheckIcon, InfoIcon, XIcon } from 'lucide-react';
import type { ConnectorTypeId, RankedStation } from '../../types/planner';
import { fmtMin, fmtPrice, fmtRs, fmtWait } from '../../utils/format';

interface ConnectorTableProps {
  r: RankedStation;
  connectors: ConnectorTypeId[];
  onPick: (stationId: string, type: ConnectorTypeId | null) => void;
}

export function ConnectorTable({ r, connectors, onPick }: ConnectorTableProps) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1.5 pr-3 font-semibold">Connector</th>
              <th scope="col" className="py-1.5 pr-3 font-semibold">Speed</th>
              <th scope="col" className="py-1.5 pr-3 font-semibold">Free / total</th>
              <th scope="col" className="py-1.5 pr-3 font-semibold">Price</th>
              <th scope="col" className="py-1.5 pr-3 font-semibold">Est. wait</th>
              <th scope="col" className="py-1.5 font-semibold">
                <span className="sr-only">Compatibility</span>
              </th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {r.connectors.map((c) => {
              const ok = connectors.includes(c.type);
              const sel = r.conn.type === c.type;
              return (
                <tr key={c.type} className={`border-t border-line ${ok ? '' : 'opacity-60'} ${sel ? 'text-go' : ''}`}>
                  <th scope="row" className="py-2 pr-3 font-semibold">{c.type}</th>
                  <td className="py-2 pr-3">{c.kw} kW</td>
                  <td className="py-2 pr-3">
                    <strong className={c.available ? 'text-go' : 'text-danger'}>{c.available}</strong> / {c.count}
                  </td>
                  <td className="py-2 pr-3">{fmtPrice(c.price)}</td>
                  <td className="py-2 pr-3">{fmtWait(c.wait)}</td>
                  <td className="py-2 font-sans">
                    {!ok ?
                    <span className="inline-flex items-center gap-1 text-muted">
                        <XIcon className="h-3 w-3" aria-hidden />
                        Not compatible
                      </span> :
                    sel ?
                    <span className="inline-flex items-center gap-1 font-semibold text-go">
                        <CheckIcon className="h-3 w-3" aria-hidden />
                        Used for estimate
                      </span> :

                    <button type="button" className="rounded border border-line px-2 py-0.5 font-semibold text-accent hover:border-accent" onClick={() => onPick(r.id, c.type)}>
                        Use {c.type}
                      </button>
                    }
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Cost estimate: ~{r.charge.kwh.toFixed(1)} kWh from the grid ({Math.round(r.charge.fromPct)}% → {r.charge.toPct}%) × {fmtPrice(r.conn.price)} for {r.conn.type} ={' '}
          <strong className="text-ink">{fmtRs(r.charge.cost)}</strong>, about {fmtMin(r.charge.minutes)} at {r.conn.kw} kW.
          {r.pinned &&
          <>
              {' '}
              <button type="button" className="font-semibold text-accent underline" onClick={() => onPick(r.id, null)}>
                Use best match instead
              </button>
            </>
          }
        </span>
      </p>
    </div>);

}