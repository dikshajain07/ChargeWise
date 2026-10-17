import React from 'react';
import { CheckIcon, FlagIcon, InfoIcon, Loader2Icon, LocateFixedIcon, MapPinIcon, AlertTriangleIcon, XCircleIcon } from 'lucide-react';
import { DESTINATIONS, PRESET_ORIGINS } from '../../data/stations';
import { usePlanner } from '../../contexts/PlannerContext';
import { haversineKm, estKm } from '../../utils/demandModel';
import { fmtKm } from '../../utils/format';
import { Panel } from '../arcade/Panel';
import { PanelHeader } from '../arcade/PanelHeader';
import { RangeSlider } from '../arcade/RangeSlider';
import { BatteryGauge } from '../arcade/BatteryGauge';
import { ArcadeButton } from '../arcade/ArcadeButton';

interface TripSetupPanelProps {
  allowPick?: boolean;
  title?: string;
}

const LOC_STYLE = {
  info: { cls: 'text-muted', icon: <InfoIcon className="h-3.5 w-3.5 text-accent" /> },
  ok: { cls: 'text-go', icon: <CheckIcon className="h-3.5 w-3.5" /> },
  warn: { cls: 'text-warn', icon: <AlertTriangleIcon className="h-3.5 w-3.5" /> },
  error: { cls: 'text-danger', icon: <XCircleIcon className="h-3.5 w-3.5" /> },
  loading: { cls: 'text-accent', icon: <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> }
};

export function TripSetupPanel({ allowPick = false, title = 'Journey' }: TripSetupPanelProps) {
  const p = usePlanner();
  const { ctx } = p;
  const dest = ctx.dest;
  const loc = LOC_STYLE[p.locStatus.tone];

  let destNote: React.ReactNode;
  if (p.destId === 'custom' && !dest) destNote = allowPick ? 'Press “Pick on map”, then click the map to drop a destination.' : 'Drop a custom destination on the Stations map.';else
  if (dest)
  destNote = `${fmtKm(haversineKm(ctx.origin, dest))} straight-line · ~${fmtKm(estKm(ctx.origin, dest, ctx.rf))} estimated${
  p.destId === 'custom' ? ` · custom pin (${dest.lat.toFixed(3)}, ${dest.lng.toFixed(3)})` : ''}`;else

  destNote = 'Recommendations will favour the closest suitable stations.';

  return (
    <Panel className="p-5" aria-labelledby="trip-title">
      <PanelHeader id="trip-title" title={title} />

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="originSelect" className="cw-label">
            Start point
          </label>
          <div className="mt-1.5 flex gap-2">
            <select
              id="originSelect"
              className="cw-input min-w-0 flex-1"
              value={p.origin.source === 'gps' ? 'gps' : p.origin.id}
              onChange={(e) => e.target.value !== 'gps' && p.selectPresetOrigin(e.target.value)}>
              
              {p.origin.source === 'gps' && <option value="gps">Your location (GPS)</option>}
              {PRESET_ORIGINS.map((o) =>
              <option key={o.id} value={o.id}>
                  Preset: {o.name}
                </option>
              )}
            </select>
            <ArcadeButton variant="ghost" onClick={p.locateUser} disabled={p.locStatus.tone === 'loading'} aria-label="Locate me">
              <LocateFixedIcon className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Locate</span>
            </ArcadeButton>
          </div>
          <div role="status" className={`mt-1.5 flex items-start gap-1.5 text-xs ${loc.cls}`}>
            <span className="mt-0.5 shrink-0" aria-hidden>
              {loc.icon}
            </span>
            <span>
              {p.locStatus.message}{' '}
              {p.locStatus.action === 'use-preset' &&
              <button type="button" className="font-semibold text-accent underline" onClick={() => p.selectPresetOrigin('cp')}>
                  Use a preset start
                </button>
              }
              {p.locStatus.action === 'retry' &&
              <button type="button" className="font-semibold text-accent underline" onClick={p.locateUser}>
                  Try again
                </button>
              }
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="destSelect" className="cw-label">
            Destination
          </label>
          <div className="mt-1.5 flex gap-2">
            <select id="destSelect" className="cw-input min-w-0 flex-1" value={p.destId} onChange={(e) => p.setDestId(e.target.value)}>
              {DESTINATIONS.map((d) =>
              <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              )}
            </select>
            {allowPick &&
            <ArcadeButton variant={p.pickMode ? 'primary' : 'ghost'} aria-pressed={p.pickMode} onClick={() => p.setPickMode(!p.pickMode)} aria-label="Pick destination on map">
                <MapPinIcon className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Pick</span>
              </ArcadeButton>
            }
          </div>
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted">
            <FlagIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden />
            {destNote}
          </p>
        </div>

        <div className="space-y-2">
          <RangeSlider id="batteryInput" label="Battery now" value={p.battery} min={1} max={100} display={`${p.battery}%`} onChange={(v) => p.setBattery(Math.round(v))} />
          <BatteryGauge pct={p.battery} reserve={p.reserve} />
          <p className="text-xs text-muted">
            ≈ {fmtKm(ctx.remainingKm)} estimated range · {fmtKm(ctx.usableKm)} above reserve · battery ≈ {Math.round(ctx.capacity)} kWh
          </p>
        </div>

        <RangeSlider id="reserveInput" label="Min. reserve on arrival" value={p.reserve} min={0} max={40} display={`${p.reserve}%`} onChange={(v) => p.setReserve(Math.round(v))} />

        <details className="group rounded-md border border-line px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-ink">Distance assumption · ×{p.roadFactor}</summary>
          <div className="mt-2">
            <label htmlFor="roadFactorSelect" className="sr-only">
              Distance estimate
            </label>
            <select id="roadFactorSelect" className="cw-input" value={p.roadFactor} onChange={(e) => p.setRoadFactor(parseFloat(e.target.value))}>
              <option value={1}>Straight-line only (×1.0)</option>
              <option value={1.25}>Typical road detour (×1.25)</option>
              <option value={1.4}>Congested / winding (×1.4)</option>
            </select>
            <p className="mt-2 text-xs text-muted">No road routing is used. Straight-line distance usually underestimates driving distance, so the factor adds a safety margin.</p>
          </div>
        </details>
      </div>
    </Panel>);

}