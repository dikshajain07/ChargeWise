import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { BADGES, XP_MISSION, XP_SAFE_MARGIN, XP_SANDBOX } from '../utils/progress';
import type { ChargingPlan } from '../types/planner';
import type { BadgeDef } from '../types/user';

interface ProgressState {
  xp: number;
  missions: number;
  sandboxRuns: number;
  badges: string[];
}

export interface Award {
  xp: number;
  badges: BadgeDef[];
}

interface ProgressValue extends ProgressState {
  awardMission: (plan: ChargingPlan, reserve: number) => Award;
  awardSandbox: () => Award;
}

const EMPTY: ProgressState = { xp: 0, missions: 0, sandboxRuns: 0, badges: [] };
const ProgressContext = createContext<ProgressValue | null>(null);

/* XP and badges are stored on this device per account (or for guests). */
function keyFor(uid: string | null) {
  return 'cw-progress-' + (uid ?? 'guest');
}

function load(uid: string | null): ProgressState {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<ProgressState>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function ProgressProvider({ children }: {children: React.ReactNode;}) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [state, setState] = useState<ProgressState>(() => load(uid));

  useEffect(() => setState(load(uid)), [uid]);

  const commit = useCallback(
    (next: ProgressState) => {
      setState(next);
      try {
        localStorage.setItem(keyFor(uid), JSON.stringify(next));
      } catch {

        /* storage unavailable */}
    },
    [uid]
  );

  const grant = (current: ProgressState, ids: string[]) => {
    const fresh = ids.filter((id) => !current.badges.includes(id));
    return { badges: [...current.badges, ...fresh], fresh: BADGES.filter((b) => fresh.includes(b.id)) };
  };

  // Only called for feasible ('ok') plans — never rewards risky choices.
  const awardMission = useCallback(
    (plan: ChargingPlan, reserve: number): Award => {
      if (plan.status !== 'ok') return { xp: 0, badges: [] };
      const missions = state.missions + 1;
      const safe = plan.arrivalPct >= reserve + 10;
      const ids = ['first-mission'];
      if (safe) ids.push('safe-margin');
      if (plan.totalKm >= 200) ids.push('long-haul');
      if (plan.stops.length > 0 && plan.stops.every((s) => s.wait === 0)) ids.push('zero-wait');
      if (missions >= 5) ids.push('veteran');
      const xp = XP_MISSION + (safe ? XP_SAFE_MARGIN : 0);
      const g = grant(state, ids);
      commit({ ...state, xp: state.xp + xp, missions, badges: g.badges });
      return { xp, badges: g.fresh };
    },
    [state, commit]
  );

  const awardSandbox = useCallback((): Award => {
    const g = grant(state, ['sandbox']);
    commit({ ...state, xp: state.xp + XP_SANDBOX, sandboxRuns: state.sandboxRuns + 1, badges: g.badges });
    return { xp: XP_SANDBOX, badges: g.fresh };
  }, [state, commit]);

  const value = useMemo(() => ({ ...state, awardMission, awardSandbox }), [state, awardMission, awardSandbox]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}