import React from 'react';
import { AlertTriangleIcon, BookmarkCheckIcon, BookmarkIcon, CheckIcon, ClockIcon, MapPinIcon, PlugIcon } from 'lucide-react';
import { CONFIG, FACTORS } from '../../data/stations';
import type { ConnectorTypeId, RankedStation, Weights } from '../../types/planner';
import { explainRecommendation } from '../../utils/recommendation';
import { fmtHour, fmtKm, fmtMin, fmtPrice, fmtRs, fmtWait } from '../../utils/format';
import { Panel } from '../arcade/Panel';
import { StatusTag } from '../arcade/StatusTag';
import { ConnectorTable } from './ConnectorTable';

interface CheckpointCardProps {
  r: RankedStation;
  rank: number;
  hasDest: boolean;
  reserve: number;
  hour: number;
  weights: Weights;
  connectors: ConnectorTypeId[];
  onFocus: (id: string) => void;
  onPickConnector: (stationId: string, type: ConnectorTypeId | null) => void;
  saved: boolean;
  canSave: boolean;
  onToggleSave: (id: string) => void;
}

export function CheckpointCard({ r, rank, hasDest, reserve, hour, weights, connectors, onFocus, onPickConnector, saved, canSave, onToggleSave }: CheckpointCardProps) {
  const top = rank === 1;
  const why = explainRecommendation(r, weights, hasDest);
  const tone = !r.free ? 'warn' : top ? 'go' : 'accent';
  const travelMin = r.estDist / CONFIG.avgSpeedKmh * 60;
  const margin = Math.round(r.arrivalPct - reserve);

  return (
    <Panel as="article" tone={tone} className={top ? 'p-5 sm:p-6' : 'p-5'} aria-labelledby={`cp-${r.id}`}>
      <div className="flex items-start gap-4">
        <div
          className={`grid shrink-0 place-items-center rounded-md border-2 font-pixel ${top ? 'h-14 w-14 text-sm' : 'h-11 w-11 text-[10px]'} ${
          tone === 'go' ? 'border-go bg-go text-on-accent' : tone === 'warn' ? 'border-warn text-warn' : 'border-accent text-accent'}`
          }
          aria-label={`Checkpoint ${rank}`}>
          
          CP{rank}
        </div>
        <div className="min-w-0 flex-1">
          {top &&
          <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-widest text-go">Recommended checkpoint</p>
          }
          <h3 id={`cp-${r.id}`} className={`font-semibold leading-tight ${top ? 'text-xl' : 'text-base'}`}>
            {r.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            {r.area} · <span className={`st-${r.level}`}>{r.status}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-mono font-bold leading-none ${top ? 'text-3xl text-go' : 'text-2xl text-ink'}`}>{Math.round(r.score)}</p>
          <p className="mt-1 text-[11px] text-muted">score /100</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {r.free ?
        <StatusTag tone="go" icon={<CheckIcon className="h-3 w-3" />}>
            {r.conn.available} of {r.conn.count} {r.conn.type} free
          </StatusTag> :

        <StatusTag tone="warn" icon={<ClockIcon className="h-3 w-3" />}>
            All {r.conn.type} busy
          </StatusTag>
        }
        <StatusTag tone="muted" icon={<PlugIcon className="h-3 w-3" />}>
          {r.conn.type} · {r.vehicleKw} kW {r.conn.fast ? 'DC' : 'AC'}
          {r.pinned ? ' · your choice' : ''}
        </StatusTag>
        <StatusTag tone="warn" title="Availability and waits come from the simulated demand model at the current model time">
          Sim · {fmtHour(hour)}
        </StatusTag>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-line py-4 sm:grid-cols-3 xl:grid-cols-6">
        <div>
          <dt className="cw-label">Price</dt>
          <dd className="mt-1 font-mono text-sm font-bold">{fmtPrice(r.cPrice)}</dd>
        </div>
        <div>
          <dt className="cw-label">Est. wait</dt>
          <dd className={`mt-1 font-mono text-sm font-bold ${r.cWait ? 'text-warn' : 'text-go'}`}>{fmtWait(r.cWait)}</dd>
        </div>
        <div>
          <dt className="cw-label">{hasDest ? 'Detour' : 'Distance'}</dt>
          <dd className="mt-1 font-mono text-sm font-bold">{fmtKm(r.distMetric)}</dd>
        </div>
        <div>
          <dt className="cw-label">Drive (est.)</dt>
          <dd className="mt-1 font-mono text-sm font-bold">{fmtMin(travelMin)}</dd>
        </div>
        <div>
          <dt className="cw-label">Arrive with</dt>
          <dd className="mt-1 font-mono text-sm font-bold">
            {Math.round(r.arrivalPct)}% <span className="text-xs font-medium text-go">+{margin} over reserve</span>
          </dd>
        </div>
        <div>
          <dt className="cw-label">Cost to {r.charge.toPct}%</dt>
          <dd className="mt-1 font-mono text-sm font-bold">{fmtRs(r.charge.cost)}</dd>
        </div>
      </dl>

      {top &&
      <p className="mt-4 text-sm">
          Recommended because it’s reachable with ~{Math.round(r.arrivalPct)}% on arrival — above your {reserve}% reserve — and scores highest for your current priorities.
        </p>
      }
      <ul className="mt-3 space-y-1.5">
        {why.map((w) =>
        <li key={w.text} className="flex items-start gap-2 text-sm">
            {w.type === 'pro' ?
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-go" aria-hidden /> :

          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
          }
            <span className={w.type === 'pro' ? '' : 'text-muted'}>{w.text}</span>
          </li>
        )}
      </ul>

      <details className="mt-4 rounded-md border border-line px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-ink">
          Connector details ({r.connectors.length} type{r.connectors.length > 1 ? 's' : ''}, {r.points} plugs)
        </summary>
        <div className="mt-3">
          <ConnectorTable r={r} connectors={connectors} onPick={onPickConnector} />
        </div>
      </details>
      <details className="mt-2 rounded-md border border-line px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-ink">Score breakdown</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {FACTORS.map((f) => {
            const n = Math.round(r.norms[f.key] * 100);
            return (
              <div key={f.key} title={`${f.label}: ${n}/100 × weight ${weights[f.key]}`}>
                <div className="flex justify-between text-xs">
                  <span>{f.label}</span>
                  <span className="font-mono text-muted">
                    {n} × {weights[f.key]}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-line/60">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${n}%` }} />
                </div>
              </div>);

          })}
        </div>
      </details>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onFocus(r.id)}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out hover:border-accent hover:text-accent">
          
          <MapPinIcon className="h-3.5 w-3.5" aria-hidden />
          Show on map
        </button>
        {canSave &&
        <button
          type="button"
          onClick={() => onToggleSave(r.id)}
          aria-pressed={saved}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out ${
          saved ? 'border-xp/60 text-xp' : 'border-line hover:border-xp hover:text-xp'}`
          }>
          
            {saved ? <BookmarkCheckIcon className="h-3.5 w-3.5" aria-hidden /> : <BookmarkIcon className="h-3.5 w-3.5" aria-hidden />}
            {saved ? 'Saved' : 'Save station'}
          </button>
        }
      </div>
    </Panel>);

}