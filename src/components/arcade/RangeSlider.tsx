import React from 'react';

interface RangeSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: React.ReactNode;
  hint?: React.ReactNode;
  onChange: (v: number) => void;
}

export function RangeSlider({ id, label, value, min, max, step = 1, display, hint, onChange }: RangeSliderProps) {
  const fill = (value - min) / (max - min) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="cw-label">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-sm font-bold text-accent">
          {display ?? value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="cw-range mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ['--fill' as string]: `${fill}%` } as React.CSSProperties}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
      
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>);

}