import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CarFrontIcon, CheckIcon } from 'lucide-react';
import { CONNECTOR_TYPES } from '../../data/stations';
import { usePlanner } from '../../contexts/PlannerContext';
import { useAuth } from '../../contexts/AuthContext';
import { Panel } from '../arcade/Panel';
import { PanelHeader } from '../arcade/PanelHeader';
import { StatusTag } from '../arcade/StatusTag';

function parseOptional(text: string, min: number, max: number): {value: number | null;error: string | null;} {
  if (text.trim() === '') return { value: null, error: null };
  const v = Number(text);
  if (!isFinite(v) || v < min || v > max) return { value: null, error: `Enter a value between ${min} and ${max}.` };
  return { value: v, error: null };
}

export function VehicleConfigPanel() {
  const p = usePlanner();
  const { user } = useAuth();
  const [kwhText, setKwhText] = useState(p.capacityKwh != null ? String(p.capacityKwh) : '');
  const [effText, setEffText] = useState(p.efficiency != null ? String(p.efficiency) : '');
  const [rangeText, setRangeText] = useState(String(p.manualRange));
  const [errors, setErrors] = useState<{kwh?: string | null;eff?: string | null;range?: string | null;}>({});

  useEffect(() => setKwhText(p.capacityKwh != null ? String(p.capacityKwh) : ''), [p.capacityKwh]);
  useEffect(() => setEffText(p.efficiency != null ? String(p.efficiency) : ''), [p.efficiency]);

  const onKwh = (t: string) => {
    setKwhText(t);
    const r = parseOptional(t, 5, 200);
    setErrors((e) => ({ ...e, kwh: r.error }));
    if (!r.error) p.setCapacityKwh(r.value);
  };
  const onEff = (t: string) => {
    setEffText(t);
    const r = parseOptional(t, 5, 40);
    setErrors((e) => ({ ...e, eff: r.error }));
    if (!r.error) p.setEfficiency(r.value);
  };
  const onRange = (t: string) => {
    setRangeText(t);
    const v = parseFloat(t);
    if (!isFinite(v) || v < 50 || v > 1000) {
      setErrors((e) => ({ ...e, range: 'Enter a range between 50 and 1000 km.' }));
      return;
    }
    setErrors((e) => ({ ...e, range: null }));
    p.setManualRange(v);
  };

  return (
    <Panel className="p-5" aria-labelledby="veh-title">
      <PanelHeader
        id="veh-title"
        title="Vehicle"
        action={
        p.vehicleLabel ?
        <StatusTag tone="xp" icon={<CarFrontIcon className="h-3 w-3" />}>
              {p.vehicleLabel}
            </StatusTag> :

        <Link to={user ? '/onboarding?add=1' : '/signup'} className="text-xs font-semibold text-accent hover:underline">
              {user ? 'Save to garage' : 'Sign up to save'}
            </Link>

        } />
      

      <fieldset className="mt-4">
        <legend className="cw-label">Connectors your EV accepts</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONNECTOR_TYPES.map((c) => {
            const on = p.connectors.includes(c.id);
            return (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out focus-within:ring-2 focus-within:ring-accent ${
                on ? 'border-accent bg-accent/10 text-ink' : 'border-line text-muted hover:text-ink'}`
                }>
                
                <input type="checkbox" className="sr-only" checked={on} onChange={() => p.toggleConnector(c.id)} />
                <span className={`grid h-3.5 w-3.5 place-items-center rounded-sm border ${on ? 'border-accent bg-accent text-on-accent' : 'border-line'}`}>
                  {on && <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />}
                </span>
                {c.id}
                <span className="font-mono text-[10px] text-muted">{c.kind}</span>
              </label>);

          })}
        </div>
        {!p.connectors.length &&
        <p role="alert" className="mt-2 text-xs font-semibold text-danger">
            Select at least one connector to see compatible stations.
          </p>
        }
      </fieldset>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="kwhInput" className="cw-label">
            Battery (kWh)
          </label>
          <input
            id="kwhInput"
            className="cw-input mt-1.5 font-mono"
            inputMode="decimal"
            placeholder="Optional"
            value={kwhText}
            aria-invalid={!!errors.kwh}
            aria-describedby="kwhErr"
            onChange={(e) => onKwh(e.target.value)} />
          
          <p id="kwhErr" className="mt-1 text-xs text-danger" role="alert">
            {errors.kwh}
          </p>
        </div>
        <div>
          <label htmlFor="effInput" className="cw-label">
            Efficiency (kWh/100 km)
          </label>
          <input
            id="effInput"
            className="cw-input mt-1.5 font-mono"
            inputMode="decimal"
            placeholder="Optional"
            value={effText}
            aria-invalid={!!errors.eff}
            aria-describedby="effErr"
            onChange={(e) => onEff(e.target.value)} />
          
          <p id="effErr" className="mt-1 text-xs text-danger" role="alert">
            {errors.eff}
          </p>
        </div>
      </div>

      <div className="mt-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="rangeInput" className="cw-label">
            Full-charge range (km)
          </label>
          {p.rangeSource === 'calculated' && <StatusTag tone="go">Calculated</StatusTag>}
          {p.rangeSource === 'assumed' &&
          <StatusTag tone="warn" title="Efficiency not set — uses the default 15 kWh/100 km assumption">
              Assumed
            </StatusTag>
          }
        </div>
        {p.rangeSource === 'manual' ?
        <>
            <input
            id="rangeInput"
            type="number"
            className="cw-input mt-1.5 font-mono"
            min={50}
            max={1000}
            step={10}
            inputMode="numeric"
            value={rangeText}
            aria-invalid={!!errors.range}
            aria-describedby="rangeErr"
            onChange={(e) => onRange(e.target.value)} />
          
            <p id="rangeErr" className="mt-1 text-xs text-danger" role="alert">
              {errors.range}
            </p>
            <p className="text-xs text-muted">Battery size is estimated as range × 0.15 kWh/km. Add battery capacity for accurate cost estimates.</p>
          </> :

        <>
            <output id="rangeInput" className="mt-1.5 block font-mono text-lg font-bold text-ink">
              {Math.round(p.range)} km
            </output>
            <p className="text-xs text-muted">
              {p.rangeSource === 'calculated' ?
            `${p.capacityKwh} kWh ÷ ${p.efficiency} kWh/100 km.` :
            `${p.capacityKwh} kWh at the default 15 kWh/100 km. Add your real-world efficiency for a better estimate.`}
            </p>
            {p.rangeError &&
          <p role="alert" className="mt-1 text-xs font-semibold text-danger">
                {p.rangeError}
              </p>
          }
          </>
        }
      </div>
    </Panel>);

}