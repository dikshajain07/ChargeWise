import React from 'react';

export type PanelTone = 'accent' | 'go' | 'warn' | 'danger' | 'xp';

interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article' | 'aside' | 'form';
  tone?: PanelTone;
  flat?: boolean;
  children: React.ReactNode;
}

const TONE: Record<PanelTone, string> = {
  accent: '',
  go: 'hud-go',
  warn: 'hud-warn',
  danger: 'hud-danger',
  xp: 'hud-xp'
};

export function Panel({ as = 'section', tone = 'accent', flat = false, className = '', children, ...rest }: PanelProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag className={['hud-panel', TONE[tone], flat ? 'hud-flat' : '', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>);

}