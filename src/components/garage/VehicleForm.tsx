import React from 'react';
import { CheckIcon } from 'lucide-react';
import { CONNECTOR_TYPES } from '../../data/stations';
import { VEHICLE_PRESETS } from '../../data/vehicles';
import { rangeFromSpecs, type VehicleDraft, type VehicleDraftErrors } from '../../utils/vehicle';
import { RangeSlider } from '../arcade/RangeSlider';
import { BatteryGauge } from '../arcade/BatteryGauge';
import { Notice } from '../arcade/Notice';

interface VehicleFormProps {
  draft: VehicleDraft;
  errors: VehicleDraftErrors;
  onChange: (d: VehicleDraft) => void;
  idPrefix?: string;
}

export function VehicleForm({ draft, errors, onChange, idPrefix = 'vf' }: VehicleFormProps) {
  const set = <K extends keyof VehicleDraft,>(k: K, v: VehicleDraft[K]) => onChange({ ...draft, [k]: v });
  const preset = VEHICLE_PRESETS.find((p) => p.id === draft.presetId);
  const kwh = draft.batteryKwh.trim() === '' ? null : Number(draft.batteryKwh);
  const eff = draft.efficiency.trim() === '' ? null : Number(draft.efficiency);
  const range = rangeFromSpecs(kwh != null && isFinite(kwh) ? kwh : null, eff != null && isFinite(eff) ? eff : null);
  const id = (s: string) => `${idPrefix}-${s}`;

  const field = (key: 'brand' | 'model' | 'batteryKwh' | 'efficiency', label: string, opts: {placeholder?: string;inputMode?: 'decimal' | 'text';hint?: string;} = {}) =>
  <div>
      <label htmlFor={id(key)} className="cw-label">
        {label}
      </label>
      <input
      id={id(key)}
      className={`cw-input mt-1.5 ${opts.inputMode === 'decimal' ? 'font-mono' : ''}`}
      inputMode={opts.inputMode ?? 'text'}
      placeholder={opts.placeholder}
      value={draft[key]}
      aria-invalid={!!errors[key]}
      aria-describedby={`${id(key)}-msg`}
      onChange={(e) => set(key, e.target.value)} />
    
      <p id={`${id(key)}-msg`} className={`mt-1 text-xs ${errors[key] ? 'text-danger' : 'text-muted'}`} role={errors[key] ? 'alert' : undefined}>
        {errors[key] ?? opts.hint}
      </p>
    </div>;


  return (
    <div className="space-y-4">
      {preset &&
      <Notice tone="info">
          Pre-filled from the {preset.brand} {preset.model} listing. {preset.source}
        </Notice>
      }
      <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {field('brand', 'Brand', { placeholder: 'e.g. Tata' })}
        {field('model', 'Model / variant', { placeholder: 'e.g. Nexon.ev 45' })}
        {field('batteryKwh', 'Usable battery (kWh)', { placeholder: 'e.g. 45', inputMode: 'decimal', hint: 'Used for range and charging-cost estimates.' })}
        {field('efficiency', 'Efficiency (kWh/100 km)', {
          placeholder: 'Optional',
          inputMode: 'decimal',
          hint: 'From your trip computer. Leave blank to use the 15 kWh/100 km default.'
        })}
      </div>

      {range ?
      <p className="text-sm">
          Estimated full-charge range: <strong className="font-mono">{Math.round(range.range)} km</strong>{' '}
          <span className={range.source === 'calculated' ? 'text-go' : 'text-warn'}>({range.source === 'calculated' ? 'from your specs' : 'default efficiency assumption'})</span>
        </p> :

      <Notice tone="warn">Without battery capacity, range and charging costs will rely on a manually entered range in the planner and are less accurate.</Notice>
      }

      <fieldset>
        <legend className="cw-label">Charging connectors</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONNECTOR_TYPES.map((c) => {
            const on = draft.connectors.includes(c.id);
            return (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out focus-within:ring-2 focus-within:ring-accent ${
                on ? 'border-accent bg-accent/10' : 'border-line text-muted hover:text-ink'}`
                }>
                
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  onChange={() => set('connectors', on ? draft.connectors.filter((x) => x !== c.id) : [...draft.connectors, c.id])} />
                
                <span className={`grid h-3.5 w-3.5 place-items-center rounded-sm border ${on ? 'border-accent bg-accent text-on-accent' : 'border-line'}`}>
                  {on && <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />}
                </span>
                {c.id}
                <span className="font-mono text-[10px] text-muted">{c.kind}</span>
              </label>);

          })}
        </div>
        {errors.connectors &&
        <p role="alert" className="mt-1.5 text-xs text-danger">
            {errors.connectors}
          </p>
        }
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--cw-accent))]" checked={draft.recordBattery} onChange={(e) => set('recordBattery', e.target.checked)} />
            Record current battery level
          </label>
          {draft.recordBattery ?
          <>
              <RangeSlider id={id('battery')} label="Battery now" value={draft.batteryPct} min={1} max={100} display={`${draft.batteryPct}%`} onChange={(v) => set('batteryPct', Math.round(v))} />
              <BatteryGauge pct={draft.batteryPct} reserve={draft.reservePct} />
            </> :

          <p className="text-xs text-muted">You can set it before each journey instead.</p>
          }
        </div>
        <RangeSlider
          id={id('reserve')}
          label="Minimum reserve on arrival"
          value={draft.reservePct}
          min={0}
          max={40}
          display={`${draft.reservePct}%`}
          hint="Stations that would leave you below this are excluded."
          onChange={(v) => set('reservePct', Math.round(v))} />
        
      </div>
    </div>);

}