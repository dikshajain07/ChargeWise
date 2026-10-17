import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CONFIG, MODES, PRESET_ORIGINS } from '../data/stations';
import { useGarage } from './GarageContext';
import { usePreferences } from './PreferencesContext';
import { computeNetwork, haversineKm } from '../utils/demandModel';
import { buildContext, evaluateStations, getDestination, rankStations } from '../utils/recommendation';
import { planChargingStops } from '../utils/chargingStops';
import { clamp } from '../utils/format';
import { rangeFromSpecs, type RangeSource } from '../utils/vehicle';
import type {
  ConnectorTypeId,
  ConnPick,
  Destination,
  EvaluatedStation,
  FactorKey,
  LatLng,
  LiveStation,
  ModeKey,
  Origin,
  PlanResult,
  RankedStation,
  StationType,
  TripContext,
  Weights } from
'../types/planner';

export interface LocStatus {
  tone: 'info' | 'ok' | 'warn' | 'error' | 'loading';
  message: string;
  action?: 'use-preset' | 'retry';
}

interface PlannerValue {
  // inputs
  origin: Origin;
  locStatus: LocStatus;
  destId: string;
  customDest: Destination | null;
  battery: number;
  manualRange: number;
  capacityKwh: number | null;
  efficiency: number | null;
  reserve: number;
  connectors: ConnectorTypeId[];
  connPick: ConnPick;
  roadFactor: number;
  mode: ModeKey | 'custom';
  weights: Weights;
  hour: number;
  demandAdj: number;
  chargeCap: number;
  avoidCongested: boolean;
  pickMode: boolean;
  forecastFilter: 'all' | StationType;
  forecastStation: string;
  vehicleLabel: string | null;
  focusId: string | null;
  // derived
  range: number;
  rangeSource: RangeSource;
  rangeError: string | null;
  ctx: TripContext;
  net: LiveStation[];
  evaluated: EvaluatedStation[];
  ranked: RankedStation[];
  plan: PlanResult;
  // actions
  setDestId: (id: string) => void;
  pickDestination: (p: LatLng) => void;
  setPickMode: (on: boolean) => void;
  setBattery: (v: number) => void;
  setManualRange: (v: number) => void;
  setCapacityKwh: (v: number | null) => void;
  setEfficiency: (v: number | null) => void;
  setReserve: (v: number) => void;
  toggleConnector: (c: ConnectorTypeId) => void;
  setConnectorAt: (stationId: string, type: ConnectorTypeId | null) => void;
  setRoadFactor: (v: number) => void;
  setMode: (m: ModeKey) => void;
  setWeight: (k: FactorKey, v: number) => void;
  setHour: (h: number) => void;
  applyDeviceClock: () => void;
  resetHour: () => void;
  setDemandAdj: (v: number) => void;
  setChargeCap: (v: number) => void;
  setAvoidCongested: (v: boolean) => void;
  setForecastFilter: (f: 'all' | StationType) => void;
  setForecastStation: (id: string) => void;
  selectPresetOrigin: (id: string) => void;
  locateUser: () => void;
  focusStation: (id: string | null) => void;
}

const PlannerContext = createContext<PlannerValue | null>(null);

const presetOrigin = (id: string): Origin => {
  const p = PRESET_ORIGINS.find((x) => x.id === id) ?? PRESET_ORIGINS[0];
  return { ...p, source: 'preset', accuracy: null };
};
const presetStatus = (name: string): LocStatus => ({
  tone: 'info',
  message: `Using preset start “${name}” — fixed coordinates, not your real location.`
});

export function PlannerProvider({ children }: {children: React.ReactNode;}) {
  const { primary } = useGarage();
  const { preferences } = usePreferences();

  const [origin, setOrigin] = useState<Origin>(() => presetOrigin('cp'));
  const [locStatus, setLocStatus] = useState<LocStatus>(() => presetStatus(PRESET_ORIGINS[0].name));
  const [destId, setDestIdState] = useState('jaipur');
  const [customDest, setCustomDest] = useState<Destination | null>(null);
  const [battery, setBattery] = useState(38);
  const [manualRange, setManualRange] = useState(400);
  const [capacityKwh, setCapacityKwh] = useState<number | null>(null);
  const [efficiency, setEfficiency] = useState<number | null>(null);
  const [reserve, setReserve] = useState(15);
  const [connectors, setConnectors] = useState<ConnectorTypeId[]>(['CCS2', 'Type 2']);
  const [connPick, setConnPick] = useState<ConnPick>({});
  const [roadFactor, setRoadFactor] = useState(1.25);
  const [mode, setModeState] = useState<ModeKey | 'custom'>('balanced');
  const [weights, setWeights] = useState<Weights>({ ...MODES.balanced.weights });
  const [hour, setHour] = useState(CONFIG.defaultHour);
  const [demandAdj, setDemandAdj] = useState(0);
  const [chargeCap, setChargeCap] = useState(80);
  const [avoidCongested, setAvoidCongested] = useState(true);
  const [pickMode, setPickMode] = useState(false);
  const [forecastFilter, setForecastFilter] = useState<'all' | StationType>('all');
  const [forecastStation, setForecastStation] = useState('saket');
  const [vehicleLabel, setVehicleLabel] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  // Pre-fill from the signed-in driver's primary vehicle.
  useEffect(() => {
    if (!primary) {
      setVehicleLabel(null);
      return;
    }
    setVehicleLabel(`${primary.brand} ${primary.model}`);
    if (primary.connectors.length) setConnectors(primary.connectors);
    if (primary.battery_pct != null) setBattery(primary.battery_pct);
    setReserve(primary.reserve_pct);
    setCapacityKwh(primary.battery_kwh);
    setEfficiency(primary.efficiency_kwh_100km);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary?.id, primary?.updated_at]);

  // Apply saved priority / default reserve preferences.
  useEffect(() => {
    if (!preferences) return;
    setModeState(preferences.priority_mode);
    setWeights({ ...MODES[preferences.priority_mode].weights });
    if (!primary) setReserve(preferences.default_reserve);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences?.priority_mode, preferences?.default_reserve]);

  const specs = rangeFromSpecs(capacityKwh, efficiency);
  const rawRange = specs ? specs.range : manualRange;
  const rangeSource: RangeSource = specs ? specs.source : 'manual';
  const rangeError = rawRange < 50 || rawRange > 1000 ? 'Full-charge range must be between 50 and 1000 km — check battery capacity and efficiency.' : null;
  const range = clamp(rawRange, 50, 1000);

  const dest = useMemo(() => getDestination(destId, customDest), [destId, customDest]);
  const ctx = useMemo(
    () => buildContext({ origin, dest, battery, range, reserve, connectors, roadFactor, capacityKwh }),
    [origin, dest, battery, range, reserve, connectors, roadFactor, capacityKwh]
  );
  const net = useMemo(() => computeNetwork(hour, demandAdj), [hour, demandAdj]);
  const evaluated = useMemo(() => evaluateStations(net, ctx, connPick), [net, ctx, connPick]);
  const ranked = useMemo(() => rankStations(evaluated, weights), [evaluated, weights]);
  const plan = useMemo(() => planChargingStops(ctx, { hour, demandAdj, chargeCap, avoidCongested, connPick }), [ctx, hour, demandAdj, chargeCap, avoidCongested, connPick]);

  const setDestId = useCallback(
    (id: string) => {
      setDestIdState(id);
      setPickMode(id === 'custom' && !customDest);
    },
    [customDest]
  );

  const pickDestination = useCallback((p: LatLng) => {
    setCustomDest({ lat: p.lat, lng: p.lng, name: 'Custom destination' });
    setDestIdState('custom');
    setPickMode(false);
  }, []);

  const toggleConnector = useCallback((c: ConnectorTypeId) => {
    setConnectors((cur) => cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]);
  }, []);

  const setConnectorAt = useCallback((stationId: string, type: ConnectorTypeId | null) => {
    setConnPick((cur) => {
      const next = { ...cur };
      if (type) next[stationId] = type;else
      delete next[stationId];
      return next;
    });
  }, []);

  const setMode = useCallback((m: ModeKey) => {
    setModeState(m);
    setWeights({ ...MODES[m].weights });
  }, []);

  const setWeight = useCallback((k: FactorKey, v: number) => {
    setWeights((w) => ({ ...w, [k]: v }));
    setModeState('custom');
  }, []);

  const applyDeviceClock = useCallback(() => {
    const d = new Date();
    setHour(d.getHours() + (d.getMinutes() >= 30 ? 0.5 : 0));
  }, []);
  const resetHour = useCallback(() => setHour(CONFIG.defaultHour), []);

  const selectPresetOrigin = useCallback((id: string) => {
    const o = presetOrigin(id);
    setOrigin(o);
    setLocStatus(presetStatus(o.name));
  }, []);

  const locateUser = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocStatus({ tone: 'error', message: 'Geolocation isn’t supported in this browser. Continuing from the preset start.' });
      return;
    }
    setLocStatus({ tone: 'loading', message: 'Requesting your location…' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const o: Origin = { id: 'gps', name: 'Your location', lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'gps', accuracy: pos.coords.accuracy };
        setOrigin(o);
        const away = haversineKm(o, { lat: CONFIG.mapCenter[0], lng: CONFIG.mapCenter[1] });
        if (away > 60) {
          setLocStatus({
            tone: 'warn',
            message: `Located (±${Math.round(pos.coords.accuracy)} m), but you’re ~${Math.round(away)} km from Delhi NCR, where the ChargeWise network is modelled — few or no stations will be reachable.`,
            action: 'use-preset'
          });
        } else {
          setLocStatus({ tone: 'ok', message: `Using your GPS location (±${Math.round(pos.coords.accuracy)} m).` });
        }
      },
      (err) => {
        const msg = ({ 1: 'Location permission was denied.', 2: 'Your position is currently unavailable.', 3: 'Locating timed out.' } as Record<number, string>)[err.code] ?? 'Could not get your location.';
        setLocStatus({ tone: 'error', message: `${msg} Still using your previous start point.`, action: 'retry' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const value: PlannerValue = {
    origin, locStatus, destId, customDest, battery, manualRange, capacityKwh, efficiency, reserve, connectors, connPick, roadFactor,
    mode, weights, hour, demandAdj, chargeCap, avoidCongested, pickMode, forecastFilter, forecastStation, vehicleLabel, focusId,
    range, rangeSource, rangeError, ctx, net, evaluated, ranked, plan,
    setDestId, pickDestination, setPickMode, setBattery, setManualRange, setCapacityKwh, setEfficiency, setReserve, toggleConnector,
    setConnectorAt, setRoadFactor, setMode, setWeight, setHour, applyDeviceClock, resetHour, setDemandAdj, setChargeCap,
    setAvoidCongested, setForecastFilter, setForecastStation, selectPresetOrigin, locateUser, focusStation: setFocusId
  };

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used inside PlannerProvider');
  return ctx;
}