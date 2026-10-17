import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AwardIcon, BookmarkXIcon, CarFrontIcon, LockIcon, PlayIcon, SettingsIcon, ZapIcon } from 'lucide-react';
import { STATIONS } from '../data/stations';
import { displayName, useAuth } from '../contexts/AuthContext';
import { useGarage } from '../contexts/GarageContext';
import { usePlanner } from '../contexts/PlannerContext';
import { useProgress } from '../contexts/ProgressContext';
import { useSound } from '../contexts/SoundContext';
import { useJourneys } from '../hooks/useJourneys';
import { useSavedStations } from '../hooks/useSavedStations';
import { BADGES, levelFor, XP_PER_LEVEL } from '../utils/progress';
import { rangeFromSpecs } from '../utils/vehicle';
import { fmtDuration, fmtHour, fmtMin, fmtPct, fmtPrice, fmtRs, priceRange } from '../utils/format';
import { Panel } from '../components/arcade/Panel';
import { PanelHeader } from '../components/arcade/PanelHeader';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ArcadeLink } from '../components/arcade/ArcadeLink';
import { BatteryGauge } from '../components/arcade/BatteryGauge';
import { RangeSlider } from '../components/arcade/RangeSlider';
import { StatusTag } from '../components/arcade/StatusTag';
import { Notice } from '../components/arcade/Notice';
import { ChargingLoader } from '../components/arcade/ChargingLoader';

export function Dashboard() {
  const { user, profile } = useAuth();
  const { primary, loading: garageLoading, updateVehicle, error: garageError } = useGarage();
  const { net, hour, ranked, setBattery } = usePlanner();
  const progress = useProgress();
  const { play } = useSound();
  const navigate = useNavigate();
  const journeys = useJourneys(5);
  const saved = useSavedStations();
  const [batteryDraft, setBatteryDraft] = useState<number>(primary?.battery_pct ?? 50);
  const [batteryMsg, setBatteryMsg] = useState<string | null>(null);
  const lvl = levelFor(progress.xp);
  const name = displayName(profile, user);
  const best = ranked[0];

  useEffect(() => setBatteryDraft(primary?.battery_pct ?? 50), [primary?.id, primary?.battery_pct]);

  const saveBattery = async () => {
    if (!primary) return;
    const r = await updateVehicle(primary.id, { battery_pct: batteryDraft });
    setBattery(batteryDraft);
    setBatteryMsg(r.error ? `Couldn’t save: ${r.error}` : 'Battery level updated.');
    play(r.error ? 'error' : 'click');
  };

  const range = primary ? rangeFromSpecs(primary.battery_kwh, primary.efficiency_kwh_100km) : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-muted">Dashboard</p>
          <h1 className="cw-logo mt-3 font-pixel text-lg leading-snug sm:text-2xl">WELCOME BACK, {name.toUpperCase()}</h1>
        </div>
        <StatusTag tone="xp" icon={<AwardIcon className="h-3 w-3" />}>
          Level {lvl.level} · {progress.xp} XP
        </StatusTag>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel tone={primary ? 'go' : 'warn'} className="p-5 sm:p-6" aria-labelledby="garage-title">
          <PanelHeader
            id="garage-title"
            title="Primary vehicle"
            action={
            <Link to="/profile" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                <SettingsIcon className="h-3.5 w-3.5" aria-hidden />
                Vehicle settings
              </Link>
            } />
          
          {garageLoading ?
          <ChargingLoader label="Loading garage" className="py-8" /> :
          garageError ?
          <Notice tone="error" className="mt-4">
              Couldn’t load your garage: {garageError}
            </Notice> :
          !primary ?
          <div className="mt-4 space-y-4">
              <Notice tone="warn">
                No vehicle saved yet. The planner is using manual inputs, so range, compatible connectors and charging costs may not match your car.
              </Notice>
              <ArcadeLink to="/onboarding" variant="primary">
                <CarFrontIcon className="h-4 w-4" aria-hidden />
                Set up my EV
              </ArcadeLink>
            </div> :

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">{primary.brand}</p>
                <p className="text-2xl font-semibold leading-tight">{primary.model}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="cw-label">Battery</dt>
                    <dd className="mt-1 font-mono font-bold">{primary.battery_kwh != null ? `${primary.battery_kwh} kWh` : 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="cw-label">Full range</dt>
                    <dd className="mt-1 font-mono font-bold">{range ? `~${Math.round(range.range)} km` : '—'}</dd>
                  </div>
                  <div>
                    <dt className="cw-label">Connectors</dt>
                    <dd className="mt-1 text-sm font-semibold">{primary.connectors.join(', ')}</dd>
                  </div>
                  <div>
                    <dt className="cw-label">Reserve</dt>
                    <dd className="mt-1 font-mono font-bold">{primary.reserve_pct}%</dd>
                  </div>
                </dl>
                {range?.source === 'assumed' && <p className="mt-3 text-xs text-warn">Range uses the default efficiency — add yours in Profile for accuracy.</p>}
              </div>
              <div className="space-y-3">
                {primary.battery_pct != null ?
              <>
                    <p className="cw-label">Last recorded battery</p>
                    <p className="font-pixel text-3xl text-go">{primary.battery_pct}%</p>
                    <BatteryGauge pct={primary.battery_pct} reserve={primary.reserve_pct} />
                  </> :

              <p className="text-sm text-muted">No battery level recorded. Set it before your next journey.</p>
              }
                <RangeSlider id="dashBattery" label="Update battery" value={batteryDraft} min={1} max={100} display={`${batteryDraft}%`} onChange={(v) => setBatteryDraft(Math.round(v))} />
                <ArcadeButton variant="ghost" size="sm" onClick={saveBattery}>
                  Save battery level
                </ArcadeButton>
                {batteryMsg &&
              <p role="status" className="text-xs text-muted">
                    {batteryMsg}
                  </p>
              }
              </div>
            </div>
          }
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5 sm:p-6" aria-label="Quick actions">
            <div className="flex flex-col gap-3">
              <ArcadeButton
                variant="start"
                size="md"
                className="w-full"
                onClick={() => {
                  play('start');
                  navigate('/route');
                }}>
                
                <PlayIcon className="h-4 w-4" fill="currentColor" aria-hidden />
                Start journey
              </ArcadeButton>
              <ArcadeLink to="/stations" variant="primary" size="lg" className="w-full">
                <ZapIcon className="h-4 w-4" aria-hidden />
                Find chargers
              </ArcadeLink>
            </div>
            {best ?
            <p className="mt-4 text-sm text-muted">
                Best checkpoint for your current setup: <strong className="text-ink">{best.name}</strong> · {best.conn.type} {fmtPrice(best.cPrice)} · est. wait {fmtMin(best.cWait)}{' '}
                <span className="text-warn">(simulated, {fmtHour(hour)})</span>
              </p> :

            <p className="mt-4 text-sm text-warn">No compatible station is reachable with your current battery and reserve.</p>
            }
          </Panel>

          <Panel tone="xp" className="p-5" aria-labelledby="xp-title">
            <PanelHeader id="xp-title" title="Progress" subtitle={`${progress.missions} feasible journeys · ${progress.sandboxRuns} sandbox runs`} />
            <div className="mt-4">
              <div className="flex justify-between font-mono text-xs text-muted">
                <span>LV {lvl.level}</span>
                <span>
                  {lvl.into}/{XP_PER_LEVEL} XP
                </span>
              </div>
              <div className="mt-1 h-2.5 rounded-sm bg-line/60" role="progressbar" aria-valuemin={0} aria-valuemax={XP_PER_LEVEL} aria-valuenow={lvl.into} aria-label="XP to next level">
                <div className="h-full rounded-sm bg-xp" style={{ width: `${lvl.pct * 100}%` }} />
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BADGES.map((b) => {
                const got = progress.badges.includes(b.id);
                return (
                  <li key={b.id} title={b.description} className={`rounded-md border px-2.5 py-2 ${got ? 'border-xp/60 bg-xp/10' : 'border-line opacity-60'}`}>
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      {got ? <AwardIcon className="h-3.5 w-3.5 text-xp" aria-hidden /> : <LockIcon className="h-3.5 w-3.5 text-muted" aria-hidden />}
                      {b.name}
                    </span>
                    <span className="sr-only">{got ? 'Earned' : 'Locked'}: {b.description}</span>
                  </li>);

              })}
            </ul>
            <p className="mt-3 text-[11px] text-muted">XP rewards feasible plans and safe margins only. It never affects recommendations.</p>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5 sm:p-6" aria-labelledby="journeys-title">
          <PanelHeader id="journeys-title" title="Recent journeys" subtitle="Plans you’ve locked in on the Route Planner." />
          {journeys.loading ?
          <ChargingLoader label="Loading" className="py-8" /> :
          journeys.error ?
          <Notice tone="error" className="mt-4">
              {journeys.error}
            </Notice> :
          journeys.journeys.length === 0 ?
          <div className="mt-4 rounded-md border border-dashed border-line p-5 text-sm text-muted">
              No journeys yet. Plan a route and press <strong className="text-ink">Lock in mission</strong> to save it here.
            </div> :

          <ul className="mt-4 divide-y divide-line">
              {journeys.journeys.map((j) =>
            <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {j.origin_name} → {j.destination_name}
                    </p>
                    <p className="text-xs text-muted">
                      {format(new Date(j.created_at), 'd MMM yyyy, HH:mm')} · {j.summary.distanceKm} km · {j.summary.stops} stop{j.summary.stops === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <p className="font-bold">{fmtRs(j.summary.costRs)}</p>
                    <p className="text-muted">{fmtDuration(j.summary.timeMin)} · arrive {j.summary.arrivalPct}%</p>
                  </div>
                </li>
            )}
            </ul>
          }
        </Panel>

        <Panel className="p-5 sm:p-6" aria-labelledby="saved-title">
          <PanelHeader id="saved-title" title="Saved stations" subtitle={`Status at model time ${fmtHour(hour)} (simulated).`} />
          {saved.loading ?
          <ChargingLoader label="Loading" className="py-8" /> :
          saved.error ?
          <Notice tone="error" className="mt-4">
              {saved.error}
            </Notice> :
          saved.saved.length === 0 ?
          <div className="mt-4 rounded-md border border-dashed border-line p-5 text-sm text-muted">
              No saved stations. Use <strong className="text-ink">Save station</strong> on any checkpoint in Charging Stations.
            </div> :

          <ul className="mt-4 divide-y divide-line">
              {saved.saved.map((s) => {
              const live = net.find((n) => n.id === s.station_id);
              const st = STATIONS.find((x) => x.id === s.station_id);
              if (!live || !st) return null;
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{st.name}</p>
                      <p className="text-xs text-muted">
                        {st.area} · {priceRange(st)} · <span className={`st-${live.level}`}>{live.status}</span>
                        {live.online ? ` · ${fmtPct(live.util)} · ~${fmtMin(live.wait)} wait` : ''}
                      </p>
                    </div>
                    <button
                    type="button"
                    onClick={() => void saved.toggle(s.station_id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line text-muted hover:border-danger hover:text-danger"
                    aria-label={`Remove ${st.name} from saved stations`}>
                    
                      <BookmarkXIcon className="h-4 w-4" />
                    </button>
                  </li>);

            })}
            </ul>
          }
        </Panel>
      </div>
    </div>);

}