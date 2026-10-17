import React from 'react';

export type Tone = 'accent' | 'go' | 'warn' | 'danger' | 'xp' | 'muted';

const TONES: Record<Tone, string> = {
  accent: 'text-accent border-accent/50 bg-accent/10',
  go: 'text-go border-go/50 bg-go/10',
  warn: 'text-warn border-warn/50 bg-warn/10',
  danger: 'text-danger border-danger/50 bg-danger/10',
  xp: 'text-xp border-xp/50 bg-xp/10',
  muted: 'text-muted border-line bg-surface-2/60'
};

interface StatusTagProps {
  tone?: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function StatusTag({ tone = 'accent', icon, children, className = '', title }: StatusTagProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide ${TONES[tone]} ${className}`}>
      
      {icon}
      {children}
    </span>);

}