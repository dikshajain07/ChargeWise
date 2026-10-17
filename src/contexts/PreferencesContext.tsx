import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';
import { useSound } from './SoundContext';
import { useTheme } from './ThemeContext';
import type { Preferences, ThemeName } from '../types/user';

type PrefPatch = Partial<Omit<Preferences, 'user_id'>>;

interface PreferencesValue {
  preferences: Preferences | null;
  error: string | null;
  updatePreferences: (patch: PrefPatch) => Promise<{error?: string;}>;
  setThemePref: (t: ThemeName) => void;
  setSoundPref: (on: boolean) => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: {children: React.ReactNode;}) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { soundOn, setSoundOn } = useSound();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uid = user?.id ?? null;

  useEffect(() => {
    const client = supabase;
    if (!client || !uid) {
      setPreferences(null);
      return;
    }
    let active = true;
    (async () => {
      const { data, error: e } = await client.from('preferences').select('*').eq('user_id', uid).maybeSingle();
      if (!active) return;
      if (e) {
        setError(e.message);
        return;
      }
      if (data) {
        const p = data as Preferences;
        setPreferences(p);
        setTheme(p.theme);
        if (p.sound_on !== soundOn) setSoundOn(p.sound_on);
        return;
      }
      const defaults: Preferences = { user_id: uid, theme, priority_mode: 'balanced', default_reserve: 15, sound_on: soundOn };
      const { data: created, error: e2 } = await client.from('preferences').upsert(defaults).select().single();
      if (!active) return;
      if (e2) setError(e2.message);else
      setPreferences(created as Preferences);
    })();
    return () => {
      active = false;
    };
    // Only reload when the signed-in user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const updatePreferences = useCallback(
    async (patch: PrefPatch) => {
      if (patch.theme) setTheme(patch.theme);
      if (patch.sound_on !== undefined) setSoundOn(patch.sound_on);
      if (!supabase || !uid) return {};
      setPreferences((p) => p ? { ...p, ...patch } : p);
      const { error: e } = await supabase.from('preferences').update(patch).eq('user_id', uid);
      if (e) {
        setError(e.message);
        return { error: e.message };
      }
      setError(null);
      return {};
    },
    [uid, setTheme, setSoundOn]
  );

  const setThemePref = useCallback((t: ThemeName) => void updatePreferences({ theme: t }), [updatePreferences]);
  const setSoundPref = useCallback((on: boolean) => void updatePreferences({ sound_on: on }), [updatePreferences]);

  const value = useMemo(() => ({ preferences, error, updatePreferences, setThemePref, setSoundPref }), [preferences, error, updatePreferences, setThemePref, setSoundPref]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider');
  return ctx;
}