import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, StarIcon, Trash2Icon } from 'lucide-react';
import { useGarage } from '../../contexts/GarageContext';
import { useSound } from '../../contexts/SoundContext';
import { draftFromVehicle, draftToInput, validateDraft, type VehicleDraft, type VehicleDraftErrors } from '../../utils/vehicle';
import { ArcadeButton } from '../arcade/ArcadeButton';
import { ChargingLoader } from '../arcade/ChargingLoader';
import { Notice } from '../arcade/Notice';
import { StatusTag } from '../arcade/StatusTag';
import { VehicleForm } from './VehicleForm';

export function GarageList() {
  const { vehicles, loading, error, updateVehicle, deleteVehicle, setPrimary } = useGarage();
  const { play } = useSound();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<VehicleDraft | null>(null);
  const [errors, setErrors] = useState<VehicleDraftErrors>({});
  const [msg, setMsg] = useState<{tone: 'ok' | 'error';text: string;} | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading && !vehicles.length) return <ChargingLoader label="Loading garage" className="py-6" />;
  if (error) return <Notice tone="error">Couldn’t load your garage: {error}</Notice>;
  if (!vehicles.length)
  return (
    <div className="rounded-md border border-dashed border-line p-5 text-sm text-muted">
        No vehicles yet.{' '}
        <Link to="/onboarding" className="font-semibold text-accent hover:underline">
          Set up your EV
        </Link>{' '}
        so the planner uses your real battery and connectors.
      </div>);


  const run = async (fn: () => Promise<{error?: string;}>, ok: string) => {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    setMsg(r.error ? { tone: 'error', text: r.error } : { tone: 'ok', text: ok });
    play(r.error ? 'error' : 'click');
    return !r.error;
  };

  const save = async (id: string) => {
    if (!draft) return;
    const e = validateDraft(draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    const ok = await run(() => updateVehicle(id, draftToInput(draft)), 'Vehicle updated.');
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-3">
      {msg &&
      <p role="status" className={`text-xs ${msg.tone === 'ok' ? 'text-go' : 'text-danger'}`}>
          {msg.text}
        </p>
      }
      <ul className="space-y-3">
        {vehicles.map((v) =>
        <li key={v.id} className={`rounded-md border p-4 ${v.is_primary ? 'border-go/50' : 'border-line'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    {v.brand} {v.model}
                  </p>
                  {v.is_primary && <StatusTag tone="go">Primary</StatusTag>}
                </div>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  {v.battery_kwh != null ? `${v.battery_kwh} kWh` : 'Battery not set'} · {v.efficiency_kwh_100km != null ? `${v.efficiency_kwh_100km} kWh/100 km` : 'Efficiency not set'} ·{' '}
                  {v.connectors.join(', ')} · reserve {v.reserve_pct}%
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!v.is_primary &&
              <ArcadeButton variant="ghost" size="sm" disabled={busy} onClick={() => void run(() => setPrimary(v.id), 'Primary vehicle changed.')}>
                    <StarIcon className="h-3.5 w-3.5" aria-hidden />
                    Make primary
                  </ArcadeButton>
              }
                <ArcadeButton
                variant="ghost"
                size="sm"
                aria-expanded={editing === v.id}
                onClick={() => {
                  setEditing(editing === v.id ? null : v.id);
                  setDraft(draftFromVehicle(v));
                  setErrors({});
                }}>
                
                  <PencilIcon className="h-3.5 w-3.5" aria-hidden />
                  {editing === v.id ? 'Close' : 'Edit'}
                </ArcadeButton>
                <ArcadeButton
                variant="danger"
                size="sm"
                disabled={busy}
                aria-label={`Delete ${v.brand} ${v.model}`}
                onClick={() => {
                  if (window.confirm(`Delete ${v.brand} ${v.model} from your garage?`)) void run(() => deleteVehicle(v.id), 'Vehicle deleted.');
                }}>
                
                  <Trash2Icon className="h-3.5 w-3.5" aria-hidden />
                </ArcadeButton>
              </div>
            </div>
            {editing === v.id && draft &&
          <div className="mt-4 border-t border-line pt-4">
                <VehicleForm draft={draft} errors={errors} onChange={setDraft} idPrefix={`edit-${v.id}`} />
                <div className="mt-4 flex gap-2">
                  <ArcadeButton variant="go" disabled={busy} onClick={() => void save(v.id)}>
                    Save changes
                  </ArcadeButton>
                  <ArcadeButton variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </ArcadeButton>
                </div>
              </div>
          }
          </li>
        )}
      </ul>
    </div>);

}