import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Journey, JourneySummary } from '../types/user';

export function useJourneys(limit = 6) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!supabase || !uid) {
      setJourneys([]);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase.from('journeys').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(limit);
    setLoading(false);
    if (e) setError(e.message);else
    {
      setError(null);
      setJourneys(data as Journey[] ?? []);
    }
  }, [uid, limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addJourney = useCallback(
    async (j: {origin_name: string;destination_name: string;summary: JourneySummary;feasible: boolean;}) => {
      if (!supabase || !uid) return { error: 'not-signed-in' };
      const { error: e } = await supabase.from('journeys').insert({ ...j, user_id: uid });
      if (e) return { error: e.message };
      await reload();
      return {};
    },
    [uid, reload]
  );

  return { journeys, loading, error, addJourney, canSave: Boolean(supabase && uid) };
}