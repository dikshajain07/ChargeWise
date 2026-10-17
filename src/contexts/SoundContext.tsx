import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { playCue, type SoundCue } from '../utils/sound';

interface SoundValue {
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;
  play: (cue: SoundCue) => void;
}

const KEY = 'cw-sound';
const SoundContext = createContext<SoundValue | null>(null);

export function SoundProvider({ children }: {children: React.ReactNode;}) {
  const [soundOn, setState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });

  const setSoundOn = useCallback((on: boolean) => {
    try {
      localStorage.setItem(KEY, on ? '1' : '0');
    } catch {

      /* storage unavailable */}
    setState(on);
    if (on) playCue('click');
  }, []);

  const play = useCallback((cue: SoundCue) => {
    if (soundOn) playCue(cue);
  }, [soundOn]);

  const value = useMemo(() => ({ soundOn, setSoundOn, play }), [soundOn, setSoundOn, play]);
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound(): SoundValue {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used inside SoundProvider');
  return ctx;
}