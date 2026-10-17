import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlagIcon, ZapIcon } from 'lucide-react';
import { usePlanner } from '../contexts/PlannerContext';
import { useAuth } from '../contexts/AuthContext';
import { useProgress, type Award } from '../contexts/ProgressContext';
import { useSound } from '../contexts/SoundContext';
import { useJourneys } from '../hooks/useJourneys';
import { connectorsLabel, fmtDuration, fmtKm, fmtRs } from '../utils/format';
import { PageHeader } from '../components/arcade/PageHeader';
import { Panel } from '../components/arcade/Panel';
import { PanelHeader } from '../components/arcade/PanelHeader';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ArcadeLink } from '../components/arcade/ArcadeLink';
import { ChargingLoader } from '../components/arcade/ChargingLoader';
import { MissionComplete } from '../components/arcade/MissionComplete';
import { TripSetupPanel } from '../components/planner/TripSetupPanel';
import { RouteSummary } from '../components/planner/RouteSummary';
import { StopsMap } from '../components/planner/StopsMap';
import { StopsTimeline } from '../components/planner/StopsTimeline';

interface Completed extends Award {
  stats: Array<{label: string;value: string;}>;
  note?: string;
}

export function RoutePlanner() {
  const p = usePlanner();
  const { user } = useAuth();
  const progress = useProgress();
  const { play } = useSound();
  const { addJourney, canSave } = useJourneys();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<Completed | null>(null);

  const plan = p.plan;
  const feasible = plan.status === 'ok';
  let blocker = '';
  if (plan.status === 'no-dest') blocker = 'Choose a destination to build a mission.';else
  if (!feasible) blocker = 'No feasible plan yet — raise your battery or charge limit, lower the reserve, or add a connector.';

  const lockIn = async () => {
    if (plan.status !== 'ok' || !p.ctx.dest) return;
    setSaving(true);
    const award = progress.awardMission(plan, p.ctx.reserve);
    let note: string | undefined;
    if (canSave) {
      const r = await addJourney({
        origin_name: p.ctx.origin.source === 'preset' ? p.ctx.origin.name : 'GPS location',
        destination_name: p.ctx.dest.name,
        feasible: true,
        summary: {
          distanceKm: Math.round(plan.totalKm),
          stops: plan.stops.length,
          costRs: Math.round(plan.totals.cost),
          waitMin: Math.round(plan.totals.wait),
          chargeMin: Math.round(plan.totals.charge),
          arrivalPct: Math.round(plan.arrivalPct),
          timeMin: Math.round(plan.totals.timeMin),
          modelHour: p.hour
        }
      });
      note = r.error ? `Couldn’t save to your journey history: ${r.error}` : 'Saved to your journey history.';
    } else if (!user) {
      note = 'XP is stored on this device. Sign in to keep a journey history.';
    }
    setSaving(false);
    play('success');
    setDone({
      ...award,
      note,
      stats: [
      { label: 'Distance', value: fmtKm(plan.totalKm) },
      { label: 'Stops', value: String(plan.stops.length) },
      { label: 'Arrive with', value: `${Math.round(plan.arrivalPct)}%` },
      { label: 'Trip time', value: fmtDuration(plan.totals.timeMin) },
      { label: 'Charging cost', value: fmtRs(plan.totals.cost) },
      { label: 'Reserve kept', value: `${p.ctx.reserve}%+` }]

    });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="ROUTE PLANNER"
        subtitle="A charging plan to your destination that never drops below your reserve. Change any input and the plan recalculates."
        action={
        <ArcadeLink to="/stations" variant="ghost">
            <ZapIcon className="h-4 w-4" aria-hidden />
            Nearby chargers
          </ArcadeLink>
        } />
      

      <RouteSummary />

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-6">
          <TripSetupPanel />
          <Panel className="p-5" aria-labelledby="strategy-title">
            <PanelHeader id="strategy-title" title="Charging strategy" subtitle={`Connectors: ${connectorsLabel(p.connectors)}`} />
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="capSelect" className="cw-label">
                  Charge up to
                </label>
                <select id="capSelect" className="cw-input mt-1.5" value={p.chargeCap} onChange={(e) => p.setChargeCap(parseInt(e.target.value, 10))}>
                  <option value={80}>80% (faster, kinder to the battery)</option>
                  <option value={90}>90%</option>
                  <option value={100}>100%</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--cw-accent))]" checked={p.avoidCongested} onChange={(e) => p.setAvoidCongested(e.target.checked)} />
                Avoid busy stops
              </label>
              <div className="border-t border-line pt-4">
                {saving ?
                <ChargingLoader label="Locking in" /> :

                <ArcadeButton variant="go" size="lg" className="w-full font-pixel text-[11px] uppercase" disabled={!feasible} onClick={lockIn}>
                    <FlagIcon className="h-4 w-4" aria-hidden />
                    Lock in mission
                  </ArcadeButton>
                }
                <p className={`mt-2 text-xs ${blocker ? 'text-warn' : 'text-muted'}`}>
                  {blocker || 'Locks in this feasible plan, awards XP and saves it to your history when signed in.'}
                </p>
              </div>
            </div>
          </Panel>
        </div>
        <StopsMap className="h-[440px] lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]" />
      </div>

      <Panel className="p-5 sm:p-6" aria-labelledby="log-title">
        <PanelHeader id="log-title" title="Mission log" subtitle="Each stop, in order, with simulated availability at your estimated arrival time." />
        <div className="mt-6">
          <StopsTimeline />
        </div>
      </Panel>

      <MissionComplete
        open={!!done}
        onClose={() => setDone(null)}
        stats={done?.stats ?? []}
        xp={done?.xp ?? 0}
        badges={done?.badges ?? []}
        savedNote={done?.note}
        secondaryAction={user ? { label: 'Dashboard', onClick: () => navigate('/dashboard') } : undefined} />
      
    </div>);

}