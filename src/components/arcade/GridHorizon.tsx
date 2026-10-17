import React from 'react';

interface GridHorizonProps {
  height?: string;
  road?: boolean;
}

/* Perspective neon grid with an optional lit road vanishing into the horizon. */
export function GridHorizon({ height = '45%', road = true }: GridHorizonProps) {
  return (
    <div className="cw-horizon" style={{ height }} aria-hidden>
      <div className="cw-horizon-plane">{road && <div className="cw-road" />}</div>
    </div>);

}