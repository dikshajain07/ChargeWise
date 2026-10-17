import React from 'react';
import { CarFrontIcon, GaugeIcon } from 'lucide-react';
import { displayName, useAuth } from '../contexts/AuthContext';
import { useGarage } from '../contexts/GarageContext';
import { useProgress } from '../contexts/ProgressContext';
import { levelFor } from '../utils/progress';
import { GridHorizon } from '../components/arcade/GridHorizon';
import { ArcadeLink } from '../components/arcade/ArcadeLink';
import { ChargingLoader } from '../components/arcade/ChargingLoader';

export function Welcome() {
  const { user, profile, profileError } = useAuth();
  const { primary, loading } = useGarage();
  const { xp } = useProgress();
  const name = displayName(profile, user);
  const needsSetup = !primary && profile?.onboarding_done !== true;

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden" aria-labelledby="welcome-title">
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-4 pt-20 text-center sm:pt-28">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-go">
          <span className="cw-blink">●</span> Player 1 ready
        </p>
        <h1 id="welcome-title" className="cw-logo mt-6 font-pixel text-xl leading-snug sm:text-3xl">
          WELCOME, {name.toUpperCase()}
        </h1>
        {loading ?
        <ChargingLoader label="Loading garage" className="mt-10" /> :

        <>
            <p className="mt-6 text-muted">
              {primary ?
            `Your ${primary.brand} ${primary.model} is loaded into the planner.` :
            'Add your EV so ranges, compatible connectors and charging costs match your car.'}
            </p>
            <p className="mt-2 font-mono text-sm text-xp">Level {levelFor(xp).level} · {xp} XP</p>
            {profileError && <p className="mt-3 text-xs text-warn">Profile couldn’t load: {profileError}</p>}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {needsSetup ?
            <>
                  <ArcadeLink to="/onboarding" variant="start" size="md">
                    <CarFrontIcon className="h-4 w-4" aria-hidden />
                    Set up my EV
                  </ArcadeLink>
                  <ArcadeLink to="/dashboard" variant="ghost" size="lg">
                    Skip for now
                  </ArcadeLink>
                </> :

            <ArcadeLink to="/dashboard" variant="start" size="md">
                  <GaugeIcon className="h-4 w-4" aria-hidden />
                  Enter dashboard
                </ArcadeLink>
            }
            </div>
          </>
        }
      </div>
      <GridHorizon height="36%" />
    </section>);

}