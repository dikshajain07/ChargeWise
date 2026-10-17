import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  tag?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action, tag }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {tag && <div className="mb-3">{tag}</div>}
        <h1 className="cw-logo font-pixel text-lg leading-snug sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </header>);

}