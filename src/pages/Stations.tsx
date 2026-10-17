import React from 'react';
import { InfoIcon, PlugIcon, AlertTriangleIcon, RouteIcon } from 'lucide-react';
import { SIM_NOTE } from '../data/stations';
import { usePlanner } from '../contexts/PlannerContext';
import { useSound } from '../contexts/SoundContext';
import { useSavedStations } from '../hooks/useSavedStations';
import { PageHeader } from '../components/arcade/PageHeader';
import { ArcadeLink } from '../components/arcade/ArcadeLink';
import { VehicleConfigPanel } from '../components/planner/VehicleConfigPanel';
import { TripSetupPanel } from '../components/planner/TripSetupPanel';
import { StationMap } from '../components/planner/StationMap';
import { ScoringControls } from '../components/planner/ScoringControls';
import { CheckpointCard } from '../components/planner/CheckpointCard';
import { ReachList } from '../components/planner/ReachList';

export function Stations() {
  const p = usePlanner();
  const { play } = useSound();
  const saved = useSavedStations();
  const top = p.ranked.slice(0, 3);

  const toggleSave = async (id: string) => {
    const r = await saved.toggle(id);
    play(r.error ? 'error' : 'click');
  };

  let content: React.ReactNode;
  if (!p.connectors.length) {
    content =
    <EmptyState icon={<PlugIcon className="h-6 w-6 text-warn" />} title="Select your EV connector" text="Tick at least one connector type in the Vehicle panel to see compatible stations." />;

  } else if (!top.length) {
    content =
    <EmptyState
      icon={<AlertTriangleIcon className="h-6 w-6 text-warn" />}
      title="No reachable, compatible stations"
      text="Try a higher battery level, a lower reserve, adding another connector your EV supports, or a start point inside Delhi NCR." />;


  } else {
    content = top.map((r, i) =>
    <CheckpointCard
      key={r.id}
      r={r}
      rank={i + 1}
      hasDest={!!p.ctx.dest}
      reserve={p.reserve}
      hour={p.hour}
      weights={p.weights}
      connectors={p.connectors}
      onFocus={p.focusStation}
      onPickConnector={p.setConnectorAt}
      saved={saved.isSaved(r.id)}
      canSave={saved.canSave}
      onToggleSave={toggleSave} />

    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="CHARGING STATIONS"
        subtitle="Configure your EV and journey. Checkpoints update instantly as you change any input."
        action={
        <ArcadeLink to="/route" variant="ghost">
            <RouteIcon className="h-4 w-4" aria-hidden />
            Plan full route
          </ArcadeLink>
        } />
      

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-6">
          <VehicleConfigPanel />
          <TripSetupPanel allowPick />
        </div>
        <StationMap className="h-[440px] lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-labelledby="cp-title" className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="cp-title" className="font-pixel text-xs uppercase text-accent">
                Checkpoints
              </h2>
              <p className="text-xs text-muted">Free compatible plugs first, then ranked by your priorities.</p>
            </div>
            <ScoringControls />
          </div>
          {content}
          {p.ranked.length > 3 && <p className="text-sm text-muted">{p.ranked.length - 3} more reachable stations are listed under Reachability.</p>}
          <p className="flex items-start gap-1.5 text-xs text-muted">
            <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {SIM_NOTE}
          </p>
        </section>
        <div>
          <ReachList />
        </div>
      </div>
    </div>);

}

function EmptyState({ icon, title, text }: {icon: React.ReactNode;title: string;text: string;}) {
  return (
    <div className="hud-panel hud-warn p-6 text-center">
      <div className="mx-auto w-fit" aria-hidden>
        {icon}
      </div>
      <p className="mt-2 font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{text}</p>
    </div>);

}