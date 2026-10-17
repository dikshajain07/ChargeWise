import React from 'react';

interface ChargingLoaderProps {
  label?: string;
  className?: string;
}

/* EV charging sequence — used only for real async work (auth, saving). */
export function ChargingLoader({ label = 'Charging…', className = '' }: ChargingLoaderProps) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex items-center gap-1" aria-hidden>
        <div className="flex h-7 w-20 gap-[3px] rounded border-2 border-accent p-[3px]">
          {[0, 1, 2, 3, 4].map((i) =>
          <span key={i} className="cw-cell flex-1 rounded-[1px] bg-go" style={{ animationDelay: `${i * 0.12}s` }} />
          )}
        </div>
        <span className="h-3 w-1 rounded-r-sm bg-accent" />
      </div>
      <span className="font-pixel text-[10px] uppercase tracking-wider text-accent">{label}</span>
    </div>);

}