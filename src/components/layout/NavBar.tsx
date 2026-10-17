import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOutIcon, ZapIcon } from 'lucide-react';
import { NAV_ITEMS } from '../../data/navigation';
import { displayName, useAuth } from '../../contexts/AuthContext';
import { usePlanner } from '../../contexts/PlannerContext';
import { ArcadeLink } from '../arcade/ArcadeLink';
import { ThemeToggle } from './ThemeToggle';
import { SoundToggle } from './SoundToggle';
import { fmtHour } from '../../utils/format';

export function NavBar() {
  const { user, profile, signOut } = useAuth();
  const { hour } = usePlanner();
  const navigate = useNavigate();
  const items = NAV_ITEMS.filter((i) => !i.auth || user);
  const name = displayName(profile, user);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-void/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="ChargeWise home">
          <span className="grid h-8 w-8 place-items-center rounded-md border-2 border-accent bg-accent/10 text-accent">
            <ZapIcon className="h-4 w-4" aria-hidden />
          </span>
          <span className="cw-logo font-pixel text-[11px] sm:text-xs">CHARGEWISE</span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {items.map((i) =>
          <NavLink
            key={i.to}
            to={i.to}
            className={({ isActive }) =>
            `relative flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-150 ease-out ${
            isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:text-ink'}`

            }>
            
              <i.icon className="h-3.5 w-3.5" aria-hidden />
              {i.label}
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/mission-control"
            className="hidden items-center gap-2 rounded-md border border-line px-2.5 py-1.5 font-mono text-xs text-muted transition-colors duration-150 ease-out hover:border-accent hover:text-ink xl:flex"
            title="Model time used for simulated availability and waits — change it in Mission Control">
            
            MODEL <strong className="text-accent">{fmtHour(hour)}</strong>
            <span className="rounded bg-warn/15 px-1 text-[10px] font-bold text-warn">SIM</span>
          </Link>
          <ThemeToggle />
          <SoundToggle />
          {user ?
          <div className="flex items-center gap-2">
              <Link
              to="/profile"
              className="grid h-9 w-9 place-items-center rounded-md border border-xp/60 bg-xp/10 font-pixel text-[10px] text-xp lg:hidden"
              aria-label={`Profile — ${name}`}>
              
                {name.charAt(0).toUpperCase()}
              </Link>
              <button
              type="button"
              onClick={handleSignOut}
              className="grid h-9 w-9 place-items-center rounded-md border border-line text-muted transition-colors duration-150 ease-out hover:border-danger hover:text-danger"
              aria-label="Log out"
              title="Log out">
              
                <LogOutIcon className="h-4 w-4" />
              </button>
            </div> :

          <div className="flex items-center gap-2">
              <ArcadeLink to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Log in
              </ArcadeLink>
              <ArcadeLink to="/signup" variant="primary" size="sm">
                Sign up
              </ArcadeLink>
            </div>
          }
        </div>
      </div>
    </header>);

}