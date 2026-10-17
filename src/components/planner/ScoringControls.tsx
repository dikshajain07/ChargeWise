import React from 'react';
import { SlidersHorizontalIcon } from 'lucide-react';
import { FACTORS, MODES } from '../../data/stations';
import { usePlanner } from '../../contexts/PlannerContext';
import type { ModeKey } from '../../types/planner';
import { SegmentedControl } from '../arcade/SegmentedControl';
import { RangeSlider } from '../arcade/RangeSlider';

export function ScoringControls() {
  const { mode, weights, setMode, setWeight } = usePlanner();
  const options = (Object.keys(MODES) as ModeKey[]).map((k) => ({ value: k, label: MODES[k].label }));

  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl ariaLabel="Recommendation priority" options={options} value={mode} onChange={setMode} />
      <details className="rounded-md border border-line px-3 py-2">
        <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted hover:text-ink">
          <SlidersHorizontalIcon className="h-3.5 w-3.5" aria-hidden />
          Scoring weights <span className="font-normal">({mode === 'custom' ? 'custom' : `${MODES[mode].label} preset`})</span>
        </summary>
        <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {FACTORS.map((f) =>
          <RangeSlider key={f.key} id={`w-${f.key}`} label={f.label} value={weights[f.key]} min={0} max={60} step={5} onChange={(v) => setWeight(f.key, v)} />
          )}
        </div>
        <p className="mt-3 text-xs text-muted">
          Each factor is normalised 0–1 across reachable compatible stations, multiplied by its weight, then summed into a 0–100 score. Stations with a free compatible plug
          always rank above busy ones.
        </p>
      </details>
    </div>);

}