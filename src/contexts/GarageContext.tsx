import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';
import type { Vehicle, VehicleInput } from '../types/user';

interface Result {
  error?: string;
}

interface GarageValue {
  vehicles: Vehicle[];
  primary: Vehicle | null;
  loading: boolean;
  error: string | null;
  addVehicle: (input: VehicleInput, makePrimary?: boolean) => Promise<Result>;
  updateVehicle: (id: string, patch: Partial<VehicleInput>) => Promise<Result>;
  deleteVehicle: (id: string) => Promise<Result>;
  setPrimary: (id: string) => Promise<Result>;
  reload: () => Promise<void>;
}

const GarageContext = createContext<GarageValue | null>(null);
const NO_ACCOUNT = 'Sign in to save vehicles to your garage.';

export function GarageProvider({ children }: {children: React.ReactNode;}) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!supabase || !uid) {
      setVehicles([]);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase.from('vehicles').select('*').eq('user_id', uid).order('created_at');
    setLoading(false);
    if (e) {
      setError(e.message);
      return;
    }
    setError(null);
    setVehicles(data as Vehicle[] ?? []);
  }, [uid]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const clearPrimary = useCallback(async () => {
    if (!supabase || !uid) return null;
    const { error: e } = await supabase.from('vehicles').update({ is_primary: false }).eq('user_id', uid).eq('is_primary', true);
    return e ? e.message : null;
  }, [uid]);

  const addVehicle = useCallback(
    async (input: VehicleInput, makePrimary = false) => {
      if (!supabase || !uid) return { error: NO_ACCOUNT };
      const isPrimary = makePrimary || vehicles.length === 0;
      if (isPrimary && vehicles.length) {
        const e = await clearPrimary();
        if (e) return { error: e };
      }
      const { error: e } = await supabase.from('vehicles').insert({ ...input, user_id: uid, is_primary: isPrimary });
      if (e) return { error: e.message };
      await reload();
      return {};
    },
    [uid, vehicles.length, clearPrimary, reload]
  );

  const updateVehicle = useCallback(
    async (id: string, patch: Partial<VehicleInput>) => {
      if (!supabase || !uid) return { error: NO_ACCOUNT };
      const { error: e } = await supabase.from('vehicles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', uid);
      if (e) return { error: e.message };
      await reload();
      return {};
    },
    [uid, reload]
  );

  const setPrimary = useCallback(
    async (id: string) => {
      if (!supabase || !uid) return { error: NO_ACCOUNT };
      const e1 = await clearPrimary();
      if (e1) return { error: e1 };
      const { error: e } = await supabase.from('vehicles').update({ is_primary: true, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', uid);
      if (e) return { error: e.message };
      await reload();
      return {};
    },
    [uid, clearPrimary, reload]
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      if (!supabase || !uid) return { error: NO_ACCOUNT };
      const target = vehicles.find((v) => v.id === id);
      const { error: e } = await supabase.from('vehicles').delete().eq('id', id).eq('user_id', uid);
      if (e) return { error: e.message };
      const next = vehicles.find((v) => v.id !== id);
      if (target?.is_primary && next) {
        await supabase.from('vehicles').update({ is_primary: true }).eq('id', next.id).eq('user_id', uid);
      }
      await reload();
      return {};
    },
    [uid, vehicles, reload]
  );

  const primary = useMemo(() => vehicles.find((v) => v.is_primary) ?? vehicles[0] ?? null, [vehicles]);

  const value = useMemo(
    () => ({ vehicles, primary, loading, error, addVehicle, updateVehicle, deleteVehicle, setPrimary, reload }),
    [vehicles, primary, loading, error, addVehicle, updateVehicle, deleteVehicle, setPrimary, reload]
  );
  return <GarageContext.Provider value={value}>{children}</GarageContext.Provider>;
}

export function useGarage(): GarageValue {
  const ctx = useContext(GarageContext);
  if (!ctx) throw new Error('useGarage must be used inside GarageProvider');
  return ctx;
}