import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon } from 'lucide-react';
import { NAV_ITEMS } from '../../data/navigation';
import { useAuth } from '../../contexts/AuthContext';

export function MobileTabBar() {
  const { user } = useAuth();
  const core = NAV_ITEMS.filter((i) => !i.auth);
  const first = user ? NAV_ITEMS[0] : { to: '/', label: 'Home', icon: HomeIcon };
  const items = [first, ...core];

  return (
    <nav aria-label="Main mobile" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-void/95 backdrop-blur-md lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((i) =>
        <li key={i.to}>
            <NavLink
            to={i.to}
            end={i.to === '/'}
            className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wide transition-colors duration-150 ease-out ${
            isActive ? 'text-accent' : 'text-muted'}`

            }>
            
              <i.icon className="h-5 w-5" aria-hidden />
              {i.label}
            </NavLink>
          </li>
        )}
      </ul>
    </nav>);

}