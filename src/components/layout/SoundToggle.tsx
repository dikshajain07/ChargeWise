import React from 'react';
import { Volume2Icon, VolumeXIcon } from 'lucide-react';
import { useSound } from '../../contexts/SoundContext';
import { usePreferences } from '../../contexts/PreferencesContext';

export function SoundToggle() {
  const { soundOn } = useSound();
  const { setSoundPref } = usePreferences();
  return (
    <button
      type="button"
      onClick={() => setSoundPref(!soundOn)}
      aria-pressed={soundOn}
      aria-label={soundOn ? 'Mute sound effects' : 'Turn on sound effects'}
      title={soundOn ? 'Mute sound effects' : 'Turn on sound effects'}
      className={`grid h-9 w-9 place-items-center rounded-md border transition-colors duration-150 ease-out hover:border-accent hover:text-accent ${
      soundOn ? 'border-accent/60 text-accent' : 'border-line text-muted'}`
      }>
      
      {soundOn ? <Volume2Icon className="h-4 w-4" /> : <VolumeXIcon className="h-4 w-4" />}
    </button>);

}