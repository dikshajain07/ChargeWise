import React, { useMemo } from 'react';
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { STATIONS } from '../../data/stations';
import { usePlanner } from '../../contexts/PlannerContext';
import { useTheme } from '../../contexts/ThemeContext';
import { computeStation } from '../../utils/demandModel';
import { fmtHour, fmtMin, fmtPct, fmtPrice, priceRange } from '../../utils/format';
import { readColor } from '../../utils/theme';
import { Panel } from '../arcade/Panel';
import { PanelHeader } from '../arcade/PanelHeader';

export function StationProfileChart() {
  const { forecastStation, hour, demandAdj } = usePlanner();
  const { theme } = useTheme();
  const st = STATIONS.find((s) => s.id === forecastStation) ?? STATIONS[0];
  const now = computeStation(st, hour, demandAdj);

  const data = useMemo(
    () =>
    Array.from({ length: 24 }, (_, h) => {
      const s = computeStation(st, h, demandAdj);
      return { h, label: String(h).padStart(2, '0'), util: Math.round(s.util * 100), wait: s.wait, level: s.level };
    }),
    [st, demandAdj]
  );

  const colors = useMemo(
    () => ({
      low: readColor('--cw-go'),
      medium: readColor('--cw-warn'),
      high: readColor('--cw-danger'),
      offline: readColor('--cw-muted'),
      muted: readColor('--cw-muted'),
      line: readColor('--cw-line'),
      accent: readColor('--cw-accent'),
      surface: readColor('--cw-surface'),
      ink: readColor('--cw-ink')
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  const inWindow = (h: number) => (h - Math.floor(hour) + 24) % 24 <= 2;

  return (
    <Panel className="p-5" aria-labelledby="profile-title">
      <PanelHeader id="profile-title" title={st.name} subtitle={`Simulated 24-hour utilisation · ${st.profile} pattern`} />
      {!st.online ?
      <p className="mt-4 rounded-md border border-dashed border-line p-4 text-sm text-muted">This station is marked offline for maintenance in the network model.</p> :

      <>
          <div className="mt-4 h-48" role="img" aria-label={`24-hour utilisation chart for ${st.name}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: colors.muted, fontSize: 10 }} interval={5} axisLine={{ stroke: colors.line }} tickLine={false} />
                <YAxis tick={{ fill: colors.muted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 130]} />
                <ReferenceLine y={100} stroke={colors.accent} strokeDasharray="4 4" label={{ value: '100% capacity', fill: colors.muted, fontSize: 10, position: 'insideTopRight' }} />
                <Tooltip
                cursor={{ fill: colors.line }}
                contentStyle={{ background: colors.surface, border: `1px solid ${colors.accent}`, borderRadius: 6, color: colors.ink, fontSize: 12 }}
                formatter={(v: number, _n, p) => [`${v}% · ~${fmtMin((p.payload as {wait: number;}).wait)} wait`, 'Utilisation']}
                labelFormatter={(l) => `${l}:00`} />
              
                <Bar dataKey="util" radius={[2, 2, 0, 0]}>
                  {data.map((d) =>
                <Cell key={d.h} fill={colors[d.level]} fillOpacity={inWindow(d.h) ? 1 : 0.45} />
                )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="cw-label">Now ({fmtHour(hour)})</dt>
              <dd className={`mt-1 font-mono text-sm font-bold capitalize st-${now.level}`}>
                {fmtPct(now.util)} · {now.level}
              </dd>
            </div>
            <div>
              <dt className="cw-label">Est. queue</dt>
              <dd className="mt-1 font-mono text-sm font-bold">{now.queue.toFixed(1)} vehicles</dd>
            </div>
            <div>
              <dt className="cw-label">Est. wait</dt>
              <dd className="mt-1 font-mono text-sm font-bold">{fmtMin(now.wait)}</dd>
            </div>
            <div>
              <dt className="cw-label">Plugs · price</dt>
              <dd className="mt-1 font-mono text-sm font-bold">
                {now.points} · {priceRange(st)}
              </dd>
            </div>
          </dl>
          <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs">
            {now.connectors.map((c) =>
          <li key={c.type} className="flex justify-between gap-2">
                <strong>{c.type}</strong>
                <span className="font-mono text-muted">
                  {c.kw} kW · {c.available}/{c.count} free · {fmtPrice(c.price)}
                </span>
              </li>
          )}
          </ul>
        </>
      }
    </Panel>);

}