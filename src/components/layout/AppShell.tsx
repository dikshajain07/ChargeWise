import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { MobileTabBar } from './MobileTabBar';

export function AppShell() {
  return (
    <div className="cw-app-bg relative min-h-screen w-full font-sans text-ink">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <NavBar />
      <main id="main" className="relative z-10 pb-24 lg:pb-12">
        <Outlet />
      </main>
      <footer className="relative z-10 hidden border-t border-line px-6 py-5 text-xs text-muted lg:block">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2">
          <span>ChargeWise — Intelligent EV Charging Planner</span>
          <span>Station availability, prices and waits come from a simulated Delhi NCR network model. Distances are straight-line estimates.</span>
        </div>
      </footer>
      <MobileTabBar />
      <div className="cw-scanlines" aria-hidden />
    </div>);

}