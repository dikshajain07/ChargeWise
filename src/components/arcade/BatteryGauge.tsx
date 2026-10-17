import React from 'react';

interface BatteryGaugeProps {
  pct: number;
  reserve?: number;
  size?: 'md' | 'lg';
  label?: string;
}

const SEGMENTS = 10;

/* Segmented battery cell. Colour: danger at/below reserve, warn under 30%, go otherwise. */
export function BatteryGauge({ pct, reserve, size = 'md', label }: BatteryGaugeProps) {
  const p = Math.max(0, Math.min(100, pct));
  const tone = reserve != null && p <= reserve ? 'danger' : p < 30 ? 'warn' : 'go';
  const color = { danger: 'bg-danger', warn: 'bg-warn', go: 'bg-go' }[tone];
  const lit = Math.ceil(p / (100 / SEGMENTS));
  const h = size === 'lg' ? 'h-20' : 'h-9';
  const aria = label ?? `Battery ${Math.round(p)}%${reserve != null ? `, reserve ${reserve}%` : ''}`;

  return (
    <div className="flex items-center gap-1" role="img" aria-label={aria}>
      <div className={`relative flex flex-1 gap-[3px] rounded-md border-2 border-accent/70 p-[3px] ${h}`}>
        {Array.from({ length: SEGMENTS }).map((_, i) =>
        <span
          key={i}
          className={`flex-1 rounded-[2px] transition-colors duration-200 ease-out ${i < lit ? color : 'bg-line/50'}`} />

        )}
        {reserve != null && reserve > 0 &&
        <span
          aria-hidden
          className="absolute -top-1.5 -bottom-1.5 w-0.5 bg-danger"
          style={{ left: `calc(${reserve}% )` }} />

        }
      </div>
      <span className={`rounded-r-sm bg-accent/70 ${size === 'lg' ? 'h-8 w-2' : 'h-4 w-1.5'}`} aria-hidden />
    </div>);

}