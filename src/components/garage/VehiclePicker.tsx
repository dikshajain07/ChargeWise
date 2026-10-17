import React, { useMemo, useState } from 'react';
import { CheckIcon, HelpCircleIcon, SearchIcon } from 'lucide-react';
import { VEHICLE_PRESETS } from '../../data/vehicles';
import type { VehiclePreset } from '../../types/user';

interface VehiclePickerProps {
  selectedId: string | null | 'custom';
  onSelect: (preset: VehiclePreset | null) => void;
}

export function VehiclePicker({ selectedId, onSelect }: VehiclePickerProps) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return VEHICLE_PRESETS.filter((v) => !t || `${v.brand} ${v.model}`.toLowerCase().includes(t));
  }, [q]);

  return (
    <div>
      <label htmlFor="vehicleSearch" className="cw-label">
        Search EVs
      </label>
      <div className="relative mt-1.5">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input id="vehicleSearch" className="cw-input pl-9" placeholder="Brand or model, e.g. Nexon" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <ul className="mt-3 grid max-h-[380px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2" role="listbox" aria-label="Vehicles">
        {results.map((v) => {
          const on = selectedId === v.id;
          return (
            <li key={v.id} role="option" aria-selected={on}>
              <button
                type="button"
                onClick={() => onSelect(v)}
                className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors duration-150 ease-out ${
                on ? 'border-go bg-go/10' : 'border-line hover:border-accent'}`
                }>
                
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold uppercase tracking-wide text-muted">{v.brand}</span>
                  <span className="block truncate text-sm font-semibold">{v.model}</span>
                </span>
                <span className="shrink-0 font-mono text-sm font-bold text-accent">{v.batteryKwh} kWh</span>
                {on && <CheckIcon className="h-4 w-4 shrink-0 text-go" aria-hidden />}
              </button>
            </li>);

        })}
        {results.length === 0 && <li className="rounded-md border border-dashed border-line p-4 text-sm text-muted sm:col-span-2">No listed vehicle matches “{q}”.</li>}
      </ul>

      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={selectedId === 'custom'}
        className={`mt-3 flex w-full items-center gap-3 rounded-md border border-dashed px-3 py-3 text-left transition-colors duration-150 ease-out ${
        selectedId === 'custom' ? 'border-go bg-go/10' : 'border-line hover:border-accent'}`
        }>
        
        <HelpCircleIcon className="h-4 w-4 text-accent" aria-hidden />
        <span>
          <span className="block text-sm font-semibold">My vehicle isn’t listed</span>
          <span className="block text-xs text-muted">Enter its specs yourself on the next step.</span>
        </span>
      </button>
    </div>);

}