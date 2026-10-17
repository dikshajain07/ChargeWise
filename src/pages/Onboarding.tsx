import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGarage } from '../contexts/GarageContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useSound } from '../contexts/SoundContext';
import { draftFromPreset, draftToInput, emptyDraft, rangeFromSpecs, validateDraft, type VehicleDraft, type VehicleDraftErrors } from '../utils/vehicle';
import type { VehiclePreset } from '../types/user';
import { Panel } from '../components/arcade/Panel';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ChargingLoader } from '../components/arcade/ChargingLoader';
import { Notice } from '../components/arcade/Notice';
import { VehiclePicker } from '../components/garage/VehiclePicker';
import { VehicleForm } from '../components/garage/VehicleForm';

const STEPS = ['Select EV', 'Details', 'Save'];

export function Onboarding() {
  const [params] = useSearchParams();
  const adding = params.get('add') === '1';
  const { updateProfile } = useAuth();
  const { addVehicle, vehicles } = useGarage();
  const { preferences } = usePreferences();
  const { play } = useSound();
  const navigate = useNavigate();
  const defaultReserve = preferences?.default_reserve ?? 15;

  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState<string | null>(null);
  const [draft, setDraft] = useState<VehicleDraft>(() => emptyDraft(defaultReserve));
  const [errors, setErrors] = useState<VehicleDraftErrors>({});
  const [makePrimary, setMakePrimary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (p: VehiclePreset | null) => {
    setSelection(p ? p.id : 'custom');
    setDraft(p ? draftFromPreset(p, defaultReserve) : emptyDraft(defaultReserve));
    setErrors({});
  };

  const next = () => {
    if (step === 1) {
      const e = validateDraft(draft);
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    play('click');
    setStep((s) => s + 1);
  };

  const skip = async () => {
    if (!adding) await updateProfile({ onboarding_done: true });
    navigate('/dashboard');
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const r = await addVehicle(draftToInput(draft), adding ? makePrimary : true);
    if (r.error) {
      setSaving(false);
      setError(r.error);
      play('error');
      return;
    }
    if (!adding) await updateProfile({ onboarding_done: true });
    setSaving(false);
    play('success');
    navigate(adding ? '/profile' : '/dashboard');
  };

  const kwh = draft.batteryKwh ? Number(draft.batteryKwh) : null;
  const eff = draft.efficiency ? Number(draft.efficiency) : null;
  const range = rangeFromSpecs(kwh, eff);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-muted">{adding ? 'Add a vehicle' : 'Garage setup'}</p>
      <h1 className="cw-logo mt-3 font-pixel text-lg leading-snug sm:text-2xl">CHOOSE YOUR RIDE</h1>

      <ol className="mt-8 flex items-center gap-2" aria-label="Setup progress">
        {STEPS.map((s, i) =>
        <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border-2 font-pixel text-[10px] ${
            i < step ? 'border-go bg-go text-on-accent' : i === step ? 'border-accent text-accent' : 'border-line text-muted'}`
            }>
            
              {i < step ? <CheckIcon className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span className={`whitespace-nowrap text-xs font-bold uppercase tracking-wide ${i === step ? 'text-ink' : 'text-muted'}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-0.5 flex-1 bg-line" aria-hidden />}
          </li>
        )}
      </ol>

      <Panel className="mt-6 p-5 sm:p-7">
        {step === 0 &&
        <>
            <h2 className="text-lg font-semibold">Select your EV</h2>
            <p className="mt-1 text-sm text-muted">Pick a listed model to pre-fill its published battery and connectors. Every value stays editable.</p>
            <div className="mt-5">
              <VehiclePicker selectedId={selection} onSelect={pick} />
            </div>
          </>
        }
        {step === 1 &&
        <>
            <h2 className="text-lg font-semibold">Confirm vehicle details</h2>
            <p className="mt-1 text-sm text-muted">Correct anything that doesn’t match your car. Blank fields are never guessed silently.</p>
            <div className="mt-5">
              <VehicleForm draft={draft} errors={errors} onChange={setDraft} />
            </div>
          </>
        }
        {step === 2 &&
        <>
            <h2 className="text-lg font-semibold">Save to your garage</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
            ['Vehicle', `${draft.brand} ${draft.model}`],
            ['Battery', kwh != null ? `${kwh} kWh` : 'Not set'],
            ['Efficiency', eff != null ? `${eff} kWh/100 km` : 'Not set — default 15 used'],
            ['Est. full range', range ? `${Math.round(range.range)} km` : 'Set in planner'],
            ['Connectors', draft.connectors.join(', ')],
            ['Battery now', draft.recordBattery ? `${draft.batteryPct}%` : 'Set before each trip'],
            ['Reserve', `${draft.reservePct}%`]].
            map(([k, v]) =>
            <div key={k}>
                  <dt className="cw-label">{k}</dt>
                  <dd className="mt-1 font-mono text-sm font-bold">{v}</dd>
                </div>
            )}
            </dl>
            {(kwh == null || eff == null) &&
          <Notice tone="warn" className="mt-5">
                {kwh == null ? 'Without battery capacity, charging costs use an estimate from range. ' : ''}
                {eff == null ? 'Without efficiency, range uses the default 15 kWh/100 km assumption. ' : ''}
                You can add these later in Profile.
              </Notice>
          }
            {adding && vehicles.length > 0 &&
          <label className="mt-5 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--cw-accent))]" checked={makePrimary} onChange={(e) => setMakePrimary(e.target.checked)} />
                Make this my primary vehicle
              </label>
          }
            {error &&
          <Notice tone="error" role="alert" className="mt-5">
                {error}
              </Notice>
          }
          </>
        }

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <button type="button" onClick={skip} className="text-sm font-semibold text-muted hover:text-ink">
            {adding ? 'Cancel' : 'Skip for now'}
          </button>
          <div className="flex gap-2">
            {step > 0 && !saving &&
            <ArcadeButton variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                Back
              </ArcadeButton>
            }
            {step < 2 ?
            <ArcadeButton variant="primary" onClick={next} disabled={step === 0 && !selection}>
                Next
                <ArrowRightIcon className="h-4 w-4" aria-hidden />
              </ArcadeButton> :
            saving ?
            <ChargingLoader label="Saving" /> :

            <ArcadeButton variant="go" onClick={save}>
                <CheckIcon className="h-4 w-4" aria-hidden />
                Save vehicle
              </ArcadeButton>
            }
          </div>
        </div>
      </Panel>
      {!adding && <p className="mt-4 text-xs text-muted">Skipping keeps the planner usable with manual inputs, but range and cost estimates will be less accurate until you add your EV.</p>}
    </div>);

}