import React from 'react';
import { ClockIcon, FlaskConicalIcon, RotateCcwIcon } from 'lucide-react';
import { CONFIG } from '../data/stations';
import { usePlanner } from '../contexts/PlannerContext';
import { fmtHour } from '../utils/format';
import type { StationType } from '../types/planner';
import { PageHeader } from '../components/arcade/PageHeader';
import { Panel } from '../components/arcade/Panel';
import { PanelHeader } from '../components/arcade/PanelHeader';
import { RangeSlider } from '../components/arcade/RangeSlider';
import { SegmentedControl } from '../components/arcade/SegmentedControl';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { ArcadeLink } from '../components/arcade/ArcadeLink';
import { Notice } from '../components/arcade/Notice';
import { StatusTag } from '../components/arcade/StatusTag';
import { ForecastTable } from '../components/forecast/ForecastTable';
import { StationProfileChart } from '../components/forecast/StationProfileChart';
import { LoadBalance } from '../components/forecast/LoadBalance';
import { NetworkInsights } from '../components/forecast/NetworkInsights';

export function MissionControl() {
  const p = usePlanner();

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="MISSION CONTROL"
        tag={<StatusTag tone="warn">Simulated forecast</StatusTag>}
        subtitle="Estimated utilisation and waits across the network over the next two hours. Model time and demand here also drive the planner."
        action={
        <ArcadeLink to="/sandbox" variant="ghost">
            <FlaskConicalIcon className="h-4 w-4" aria-hidden />
            Sandbox mode
          </ArcadeLink>
        } />
      

      <Panel className="p-5" aria-label="Forecast controls">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto_1fr_auto]">
          <RangeSlider id="hourInput" label="Model time" value={p.hour} min={0} max={23.5} step={0.5} display={fmtHour(p.hour)} onChange={p.setHour} />
          <div className="flex flex-wrap gap-2">
            <ArcadeButton variant="ghost" size="sm" onClick={p.applyDeviceClock}>
              <ClockIcon className="h-3.5 w-3.5" aria-hidden />
              Device clock
            </ArcadeButton>
            <ArcadeButton variant="ghost" size="sm" onClick={p.resetHour}>
              <RotateCcwIcon className="h-3.5 w-3.5" aria-hidden />
              Reset to {fmtHour(CONFIG.defaultHour)}
            </ArcadeButton>
          </div>
          <RangeSlider
            id="demandInput"
            label="Overall demand assumption"
            value={p.demandAdj}
            min={-30}
            max={50}
            step={5}
            display={`${p.demandAdj > 0 ? '+' : ''}${p.demandAdj}%`}
            onChange={(v) => p.setDemandAdj(Math.round(v))} />
          
          <SegmentedControl<'all' | StationType>
            size="sm"
            ariaLabel="Station type"
            value={p.forecastFilter}
            onChange={p.setForecastFilter}
            options={[
            { value: 'all', label: 'All' },
            { value: 'city', label: 'City' },
            { value: 'highway', label: 'Highway' }]
            } />
          
        </div>
      </Panel>

      <Notice tone="sim">
        <strong>Modelled, not measured.</strong> Calculated from each station’s baseline utilisation, a time-of-day pattern and your demand assumption. It isn’t trained on
        historical data, and the same inputs always give the same result.
      </Notice>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel className="min-w-0 p-5" aria-labelledby="ft-title">
          <PanelHeader
            id="ft-title"
            title="Utilisation by station"
            subtitle="Select a station to see its 24-hour pattern."
            action={
            <div className="flex flex-wrap gap-1.5">
                <StatusTag tone="go">Low &lt;50%</StatusTag>
                <StatusTag tone="warn">Medium</StatusTag>
                <StatusTag tone="danger">High ≥80%</StatusTag>
              </div>
            } />
          
          <div className="mt-4">
            <ForecastTable />
          </div>
        </Panel>
        <div className="space-y-6">
          <StationProfileChart />
          <LoadBalance />
        </div>
      </div>

      <NetworkInsights />
    </div>);

}