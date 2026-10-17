import React from 'react';
import { GridHorizon } from '../arcade/GridHorizon';
import { Panel } from '../arcade/Panel';

interface AuthLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1400px] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-line lg:block">
        <div className="relative z-10 flex h-full flex-col justify-start p-12 pt-24">
          <p className="cw-logo font-pixel text-3xl leading-tight">CHARGEWISE</p>
          <p className="pixel-glow-go mt-5 font-pixel text-[11px] leading-loose text-go">POWER YOUR JOURNEY.<br />MASTER YOUR ENERGY.</p>
          <p className="mt-6 max-w-sm text-sm text-muted">Save your EV, keep a safe reserve on every trip, and pick up your journeys on any device.</p>
        </div>
        <GridHorizon height="50%" />
      </div>
      <div className="flex items-start justify-center px-4 py-10 sm:py-16 lg:items-center">
        <Panel className="w-full max-w-md p-6 sm:p-8">
          <h1 className="font-pixel text-base leading-snug text-accent">{title}</h1>
          {subtitle && <p className="mt-3 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </Panel>
      </div>
    </div>);

}