import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { readColor } from '../../utils/theme';
import { Panel } from '../arcade/Panel';
import { PanelHeader } from '../arcade/PanelHeader';

interface SandboxChartsProps {
  stationName: string;
  hourly: Array<{label: string;before: number;after: number;}>;
  distribution: Array<{id: string;name: string;util: number;selected: boolean;}>;
}

export function SandboxCharts({ stationName, hourly, distribution }: SandboxChartsProps) {
  const { theme } = useTheme();
  const c = useMemo(
    () => ({
      accent: readColor('--cw-accent'),
      go: readColor('--cw-go'),
      xp: readColor('--cw-xp'),
      warn: readColor('--cw-warn'),
      danger: readColor('--cw-danger'),
      muted: readColor('--cw-muted'),
      line: readColor('--cw-line'),
      surface: readColor('--cw-surface'),
      ink: readColor('--cw-ink'),
      dim: readColor('--cw-accent', 0.35)
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );
  const tooltipStyle = { background: c.surface, border: `1px solid ${c.accent}`, borderRadius: 6, color: c.ink, fontSize: 12 };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel className="p-5" aria-labelledby="wait-chart-title">
        <PanelHeader id="wait-chart-title" title="24h wait · before vs after" subtitle={`${stationName} — estimated average wait in minutes (simulated).`} />
        <div className="mt-4 h-64" role="img" aria-label={`Estimated wait over 24 hours at ${stationName}, before and after the scenario`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={c.line} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: c.muted, fontSize: 10 }} interval={3} axisLine={{ stroke: c.line }} tickLine={false} />
              <YAxis tick={{ fill: c.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `${l}:00`} formatter={(v: number, n) => [`${v} min`, n === 'before' ? 'Before' : 'After']} />
              <Legend wrapperStyle={{ fontSize: 12, color: c.muted }} formatter={(v) => v === 'before' ? 'Before' : 'After (scenario)'} />
              <Line type="monotone" dataKey="before" stroke={c.muted} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="after" stroke={c.go} strokeWidth={3} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="p-5" aria-labelledby="dist-chart-title">
        <PanelHeader id="dist-chart-title" title="Network demand distribution" subtitle="Utilisation by station at the model time, with your scenario applied (highlighted)." />
        <div className="mt-4 h-64" role="img" aria-label="Utilisation by station with the scenario applied">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={c.line} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={false} axisLine={{ stroke: c.line }} />
              <YAxis tick={{ fill: c.muted, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
              <ReferenceLine y={80} stroke={c.warn} strokeDasharray="4 4" />
              <ReferenceLine y={100} stroke={c.danger} strokeDasharray="4 4" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: c.line }} formatter={(v: number) => [`${v}%`, 'Utilisation']} />
              <Bar dataKey="util" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                {distribution.map((d) =>
                <Cell key={d.id} fill={d.selected ? c.xp : c.dim} />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted">Dashed lines mark 80% (busy) and 100% (queues form).</p>
      </Panel>
    </div>);

}