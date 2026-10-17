import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { SavedStation } from '../types/user';

export function useSavedStations() {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [saved, setSaved] = useState<SavedStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!supabase || !uid) {
      setSaved([]);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase.from('saved_stations').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    setLoading(false);
    if (e) setError(e.message);else
    {
      setError(null);
      setSaved(data as SavedStation[] ?? []);
    }
  }, [uid]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isSaved = useCallback((stationId: string) => saved.some((s) => s.station_id === stationId), [saved]);

  const toggle = useCallback(
    async (stationId: string) => {
      if (!supabase || !uid) return { error: 'Sign in to save stations.' };
      const existing = saved.find((s) => s.station_id === stationId);
      const { error: e } = existing ?
      await supabase.from('saved_stations').delete().eq('id', existing.id).eq('user_id', uid) :
      await supabase.from('saved_stations').insert({ user_id: uid, station_id: stationId });
      if (e) {
        setError(e.message);
        return { error: e.message };
      }
      await reload();
      return {};
    },
    [uid, saved, reload]
  );

  return { saved, loading, error, isSaved, toggle, canSave: Boolean(supabase && uid) };
}