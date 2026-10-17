import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightIcon, BarChart3Icon, FlaskConicalIcon, PlayIcon, RouteIcon, ZapIcon } from 'lucide-react';
import { STATIONS } from '../data/stations';
import { useAuth } from '../contexts/AuthContext';
import { usePlanner } from '../contexts/PlannerContext';
import { useSound } from '../contexts/SoundContext';
import { fmtHour, fmtKm, fmtMin } from '../utils/format';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { BatteryGauge } from '../components/arcade/BatteryGauge';
import { GridHorizon } from '../components/arcade/GridHorizon';
import { Panel } from '../components/arcade/Panel';
import { StatusTag } from '../components/arcade/StatusTag';

const MODES = [
{ to: '/stations', icon: ZapIcon, title: 'Charging Stations', text: 'Ranked, connector-aware checkpoints within your safe range.' },
{ to: '/route', icon: RouteIcon, title: 'Route Planner', text: 'Multi-stop charging plan that protects your reserve.' },
{ to: '/mission-control', icon: BarChart3Icon, title: 'Mission Control', text: 'Demand forecast, waits and network load by hour.' },
{ to: '/sandbox', icon: FlaskConicalIcon, title: 'Sandbox Mode', text: 'Add charging points or change prices and compare results.' }];


export function Home() {
  const { user, configured } = useAuth();
  const { net, hour, battery, reserve, ctx, vehicleLabel } = usePlanner();
  const { play } = useSound();
  const navigate = useNavigate();

  const online = net.filter((s) => s.online);
  const busy = online.filter((s) => s.util >= 0.8).length;
  const fastDc = online.filter((s) => s.fast).length;
  const avgWait = online.length ? online.reduce((a, s) => a + s.wait, 0) / online.length : 0;

  const start = () => {
    play('start');
    navigate('/route');
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-line" aria-labelledby="home-title">
        <div className="relative z-10 mx-auto grid max-w-[1400px] gap-10 px-4 pb-56 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:pb-64 lg:pt-20">
          <div className="flex flex-col items-start">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-muted">
              <span className="cw-blink text-go">▶</span> Press start
            </p>
            <h1 id="home-title" className="cw-logo mt-5 font-pixel text-[34px] leading-none sm:text-5xl xl:text-6xl">
              CHARGEWISE
            </h1>
            <p className="pixel-glow-go mt-6 font-pixel text-[11px] leading-loose text-go sm:text-sm">POWER YOUR JOURNEY. MASTER YOUR ENERGY.</p>
            <p className="mt-6 max-w-lg text-base text-muted">
              An intelligent EV charging planner. Find compatible chargers you can actually reach, keep your reserve intact, and plan every stop to your destination.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <ArcadeButton variant="start" size="lg" onClick={start}>
                <PlayIcon className="h-4 w-4" fill="currentColor" aria-hidden />
                Start journey
              </ArcadeButton>
              <Link to="/stations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                Find chargers <ArrowRightIcon className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            {!user &&
            <p className="mt-6 text-sm text-muted">
                {configured ?
              <>
                    <Link to="/login" className="font-semibold text-ink underline">
                      Log in
                    </Link>{' '}
                    or{' '}
                    <Link to="/signup" className="font-semibold text-ink underline">
                      create an account
                    </Link>{' '}
                    to save your EV and journeys.
                  </> :

              'Planning works without an account. Saved vehicles and journey history activate once accounts are connected.'
              }
              </p>
            }
          </div>

          <div className="flex flex-col gap-4">
            <Panel tone="go" className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="cw-label">Your battery</p>
                  <p className="mt-2 font-pixel text-4xl text-go">{battery}%</p>
                </div>
                {vehicleLabel ? <StatusTag tone="xp">{vehicleLabel}</StatusTag> : <StatusTag tone="muted">Session vehicle</StatusTag>}
              </div>
              <div className="mt-5">
                <BatteryGauge pct={battery} reserve={reserve} size="lg" />
              </div>
              <p className="mt-4 text-sm text-muted">
                ~{fmtKm(ctx.remainingKm)} est. range · {reserve}% reserve marked in red. Adjust in{' '}
                <Link to="/stations" className="font-semibold text-accent hover:underline">
                  journey setup
                </Link>
                .
              </p>
            </Panel>

            <Panel className="p-5" aria-labelledby="status-title">
              <div className="flex items-center justify-between gap-2">
                <h2 id="status-title" className="font-pixel text-[10px] uppercase text-accent">
                  System status
                </h2>
                <StatusTag tone="warn">Simulated network</StatusTag>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3">
                {[
                ['Stations', `${online.length}/${STATIONS.length}`, 'online'],
                ['Fast DC', String(fastDc), 'stations'],
                ['Busy ≥80%', String(busy), `at ${fmtHour(hour)}`],
                ['Avg wait', fmtMin(avgWait), 'estimated'],
                ['Model time', fmtHour(hour), 'Delhi NCR'],
                ['Accounts', configured ? 'Online' : 'Off', configured ? 'Supabase' : 'not configured']].
                map(([k, v, h]) =>
                <div key={k}>
                    <dt className="cw-label">{k}</dt>
                    <dd className="mt-1 font-mono text-base font-bold">{v}</dd>
                    <dd className="text-[11px] text-muted">{h}</dd>
                  </div>
                )}
              </dl>
            </Panel>
          </div>
        </div>
        <GridHorizon height="210px" />
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6" aria-labelledby="modes-title">
        <h2 id="modes-title" className="font-pixel text-xs uppercase text-accent">
          Select mode
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {MODES.map((m) =>
          <li key={m.to}>
              <Link
              to={m.to}
              onClick={() => play('click')}
              className="hud-panel group flex h-full flex-col p-5 transition-[transform,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-accent">
              
                <m.icon className="h-6 w-6 text-accent" aria-hidden />
                <span className="mt-4 text-lg font-semibold">{m.title}</span>
                <span className="mt-1 text-sm text-muted">{m.text}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold uppercase tracking-wider text-accent">
                  Enter <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          )}
        </ul>
      </section>
    </>);

}