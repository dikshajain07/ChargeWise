import React from 'react';

interface PanelHeaderProps {
  title: string;
  id?: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  level?: 'h2' | 'h3';
}

export function PanelHeader({ title, id, subtitle, action, level = 'h2' }: PanelHeaderProps) {
  const H = level;
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <H id={id} className="font-pixel text-[11px] leading-relaxed tracking-wide text-accent uppercase">
          {title}
        </H>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>);

}