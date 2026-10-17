import React from 'react';

type StatTone = 'ink' | 'accent' | 'go' | 'warn' | 'danger' | 'xp';

interface HudStatProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: StatTone;
  size?: 'sm' | 'md' | 'lg';
}

const TONE: Record<StatTone, string> = {
  ink: 'text-ink',
  accent: 'text-accent',
  go: 'text-go',
  warn: 'text-warn',
  danger: 'text-danger',
  xp: 'text-xp'
};

const SIZE = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };

export function HudStat({ label, value, hint, tone = 'ink', size = 'md' }: HudStatProps) {
  return (
    <div className="min-w-0">
      <dt className="cw-label">{label}</dt>
      <dd className={`mt-1 font-mono font-bold leading-tight ${SIZE[size]} ${TONE[tone]}`}>{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-muted">{hint}</dd>}
    </div>);

}