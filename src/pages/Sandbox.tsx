import React, { useState } from 'react';
import { ArrowRightIcon, BarChart3Icon, RotateCcwIcon, SaveIcon } from 'lucide-react';
import { STATIONS } from '../data/stations';
import { useProgress } from '../contexts/ProgressContext';
import { useSound } from '../contexts/SoundContext';
import { useSandbox } from '../hooks/useSandbox';
import { fmtHour, fmtMin, fmtPct, priceRange } from '../utils/format';
import { PageHeader } from '../components/arcade/PageHeader';
import { Panel } from '../components/arcade/Panel';
import { PanelHeader } from '../components/arcade/PanelHeader';
import { RangeSlider } from '../components/arcade/RangeSlider';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ArcadeLink } from '../components/arcade/ArcadeLink';
import { Notice } from '../components/arcade/Notice';
import { StatusTag } from '../components/arcade/StatusTag';
import { SandboxCharts } from '../components/sandbox/SandboxCharts';

export function Sandbox() {
  const s = useSandbox();
  const { awardSandbox } = useProgress();
  const { play } = useSound();
  const [logged, setLogged] = useState<string | null>(null);

  const log = () => {
    const a = awardSandbox();
    play('success');
    setLogged(`Scenario logged · +${a.xp} XP${a.badges.length ? ` · badge unlocked: ${a.badges.map((b) => b.name).join(', ')}` : ''}`);
  };

  const rows: Array<{label: string;before: string;after: string;better: boolean | null;}> = [
  { label: 'Utilisation', before: fmtPct(s.before.util), after: fmtPct(s.after.util), better: s.after.util === s.before.util ? null : s.after.util < s.before.util },
  { label: 'Est. wait', before: fmtMin(s.before.wait), after: fmtMin(s.after.wait), better: Math.round(s.after.wait) === Math.round(s.before.wait) ? null : s.after.wait < s.before.wait },
  { label: 'Est. queue', before: `${s.before.queue.toFixed(1)} veh`, after: `${s.after.queue.toFixed(1)} veh`, better: s.after.queue === s.before.queue ? null : s.after.queue < s.before.queue },
  {
    label: 'Free plugs',
    before: `${s.before.connectors.reduce((a, c) => a + c.available, 0)}/${s.before.points}`,
    after: `${s.after.connectors.reduce((a, c) => a + c.available, 0)}/${s.after.points}`,
    better: null
  },
  { label: 'Price', before: priceRange(s.base), after: priceRange(s.scenario), better: null },
  {
    label: 'Rank for your journey',
    before: s.rankBefore ? `#${s.rankBefore}` : 'Not ranked',
    after: s.rankAfter ? `#${s.rankAfter}` : 'Not ranked',
    better: s.rankBefore && s.rankAfter && s.rankAfter !== s.rankBefore ? s.rankAfter < s.rankBefore : null
  }];


  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="SANDBOX MODE"
        tag={<StatusTag tone="warn">Simulated scenario</StatusTag>}
        subtitle="Change a station’s charging points or pricing and compare the modelled impact on waits, utilisation and your recommendations."
        action={
        <ArcadeLink to="/mission-control" variant="ghost">
            <BarChart3Icon className="h-4 w-4" aria-hidden />
            Mission control
          </ArcadeLink>
        } />
      

      <Notice tone="sim">
        Scenario results come from the same queue model as the planner. They’re modelled estimates for comparison, not measurements. Vehicle arrivals are held constant when you
        add or remove points.
      </Notice>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Panel className="space-y-5 p-5" aria-labelledby="sb-controls">
          <PanelHeader id="sb-controls" title="Scenario" subtitle={`Model time ${fmtHour(s.hour)} — change it in Mission Control.`} />
          <div>
            <label htmlFor="sbStation" className="cw-label">
              Station
            </label>
            <select id="sbStation" className="cw-input mt-1.5" value={s.stationId} onChange={(e) => s.setStationId(e.target.value)}>
              {STATIONS.map((st) =>
              <option key={st.id} value={st.id}>
                  {st.name} · {st.points} plugs{st.online ? '' : ' · offline'}
                </option>
              )}
            </select>
          </div>
          {!s.base.online &&
          <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--cw-accent))]" checked={s.forceOnline} onChange={(e) => s.setForceOnline(e.target.checked)} />
              Bring this station back online
            </label>
          }
          <RangeSlider
            id="sbPoints"
            label="Charging points"
            value={s.extraPoints}
            min={-(s.base.points - 1)}
            max={8}
            display={`${s.extraPoints >= 0 ? '+' : ''}${s.extraPoints} → ${s.scenario.points}`}
            hint="Added points go to the fastest connector group."
            onChange={(v) => s.setExtraPoints(Math.round(v))} />
          
          <RangeSlider
            id="sbPrice"
            label="Price change (₹/kWh)"
            value={s.priceDelta}
            min={-8}
            max={8}
            step={0.5}
            display={`${s.priceDelta > 0 ? '+' : ''}${s.priceDelta}`}
            hint="Applied to every connector at this station."
            onChange={s.setPriceDelta} />
          
          <RangeSlider
            id="sbSens"
            label="Price sensitivity (assumption)"
            value={s.sensitivity}
            min={0}
            max={1.5}
            step={0.1}
            display={s.sensitivity === 0 ? 'Off' : s.sensitivity.toFixed(1)}
            hint={
            s.sensitivity === 0 ?
            'Off: price changes affect cost and ranking only, not demand.' :
            `Demand × ${s.demandFactor.toFixed(2)} from the price change. This is an assumption, not a measured response.`
            }
            onChange={s.setSensitivity} />
          
          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <ArcadeButton variant="go" onClick={log} disabled={!s.changed}>
              <SaveIcon className="h-4 w-4" aria-hidden />
              Log scenario
            </ArcadeButton>
            <ArcadeButton variant="ghost" onClick={s.reset} disabled={!s.changed}>
              <RotateCcwIcon className="h-4 w-4" aria-hidden />
              Reset
            </ArcadeButton>
          </div>
          {logged &&
          <p role="status" className="text-xs font-semibold text-xp">
              {logged}
            </p>
          }
        </Panel>

        <Panel tone={s.changed ? 'xp' : 'accent'} className="p-5 sm:p-6" aria-labelledby="sb-compare">
          <PanelHeader id="sb-compare" title={`${s.base.name} · before → after`} subtitle={`${s.base.area} · ${s.base.profile} demand pattern`} />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-muted">
                  <th scope="col" className="pb-2 font-semibold">Metric</th>
                  <th scope="col" className="pb-2 font-semibold">Before</th>
                  <th scope="col" className="pb-2 font-semibold">
                    <span className="sr-only">changes to</span>
                  </th>
                  <th scope="col" className="pb-2 font-semibold">After</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {rows.map((r) =>
                <tr key={r.label} className="border-t border-line">
                    <th scope="row" className="py-3 pr-4 font-sans text-sm font-semibold">
                      {r.label}
                    </th>
                    <td className="py-3 pr-2 text-base text-muted">{r.before}</td>
                    <td className="py-3 pr-2" aria-hidden>
                      <ArrowRightIcon className="h-4 w-4 text-muted" />
                    </td>
                    <td className={`py-3 text-lg font-bold ${r.better === true ? 'text-go' : r.better === false ? 'text-danger' : 'text-ink'}`}>{r.after}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!s.rankBefore && !s.rankAfter && s.exclusion && <p className="mt-3 text-xs text-muted">Not ranked for your current journey: {s.exclusion}</p>}
        </Panel>
      </div>

      <SandboxCharts stationName={s.base.name} hourly={s.hourly} distribution={s.distribution} />
    </div>);

}