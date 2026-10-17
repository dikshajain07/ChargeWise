import React from 'react';
import { DatabaseIcon } from 'lucide-react';
import { Panel } from '../arcade/Panel';
import { ArcadeLink } from '../arcade/ArcadeLink';

/* Shown wherever accounts are needed but no Supabase project is connected. */
export function AccountsNotConfigured() {
  return (
    <Panel tone="warn" className="p-6">
      <div className="flex items-start gap-3">
        <DatabaseIcon className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden />
        <div>
          <h2 className="font-pixel text-[11px] uppercase leading-relaxed text-warn">Accounts not configured</h2>
          <p className="mt-2 text-sm text-muted">
            Sign-in, saved vehicles and journey history need a connected Supabase project. Add the project URL and anon key, then run the setup SQL in
            <span className="font-mono text-ink"> docs/supabase-setup.md</span>.
          </p>
          <p className="mt-2 text-sm text-muted">The planner, forecasts and sandbox work fully without an account.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ArcadeLink to="/stations" variant="primary" size="sm">
              Find chargers
            </ArcadeLink>
            <ArcadeLink to="/route" variant="ghost" size="sm">
              Plan a route
            </ArcadeLink>
          </div>
        </div>
      </div>
    </Panel>);

}