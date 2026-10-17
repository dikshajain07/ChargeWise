import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOutIcon, MoonIcon, PlusIcon, StarIcon, SunIcon, Trash2Icon } from 'lucide-react';
import { MODES } from '../data/stations';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../contexts/SoundContext';
import type { ModeKey } from '../types/planner';
import { PageHeader } from '../components/arcade/PageHeader';
import { Panel } from '../components/arcade/Panel';
import { PanelHeader } from '../components/arcade/PanelHeader';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { RangeSlider } from '../components/arcade/RangeSlider';
import { SegmentedControl } from '../components/arcade/SegmentedControl';
import { Notice } from '../components/arcade/Notice';
import { GarageList } from '../components/garage/GarageList';

export function Profile() {
  const { user, profile, updateProfile, signOut, deleteAccount } = useAuth();
  const { preferences, updatePreferences, error: prefError } = usePreferences();
  const { theme } = useTheme();
  const { soundOn } = useSound();
  const navigate = useNavigate();

  const [name, setName] = useState(profile?.full_name ?? '');
  const [nameMsg, setNameMsg] = useState<{tone: 'ok' | 'error';text: string;} | null>(null);
  const [reserve, setReserve] = useState(preferences?.default_reserve ?? 15);
  const [confirmText, setConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setName(profile?.full_name ?? ''), [profile?.full_name]);
  useEffect(() => setReserve(preferences?.default_reserve ?? 15), [preferences?.default_reserve]);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setNameMsg({ tone: 'error', text: 'Enter your full name.' });
      return;
    }
    const r = await updateProfile({ full_name: name.trim() });
    setNameMsg(r.error ? { tone: 'error', text: r.error } : { tone: 'ok', text: 'Name updated.' });
  };

  const logout = async () => {
    await signOut();
    navigate('/');
  };

  const remove = async () => {
    setDeleting(true);
    setDeleteError(null);
    const r = await deleteAccount();
    setDeleting(false);
    if (r.error) setDeleteError(r.error.includes('delete_own_account') ? 'Account deletion isn’t enabled on the server yet. Run the setup SQL in docs/supabase-setup.md.' : r.error);else
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="PROFILE & SETTINGS"
        subtitle={user?.email}
        action={
        <ArcadeButton variant="ghost" onClick={logout}>
            <LogOutIcon className="h-4 w-4" aria-hidden />
            Log out
          </ArcadeButton>
        } />
      

      <Panel className="p-5 sm:p-6" aria-labelledby="acct-title">
        <PanelHeader id="acct-title" title="Account" />
        <form onSubmit={saveName} className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="fullName" className="cw-label">
              Full name
            </label>
            <input id="fullName" className="cw-input mt-1.5" value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="emailRo" className="cw-label">
              Email
            </label>
            <input id="emailRo" className="cw-input mt-1.5 opacity-70" value={user?.email ?? ''} readOnly />
          </div>
          <ArcadeButton type="submit" variant="primary">
            Save
          </ArcadeButton>
        </form>
        {nameMsg &&
        <p role="status" className={`mt-2 text-xs ${nameMsg.tone === 'ok' ? 'text-go' : 'text-danger'}`}>
            {nameMsg.text}
          </p>
        }
      </Panel>

      <Panel className="p-5 sm:p-6" aria-labelledby="garage-title">
        <PanelHeader
          id="garage-title"
          title="Garage"
          subtitle="Your primary vehicle pre-fills the planner."
          action={
          <ArcadeButton variant="ghost" size="sm" onClick={() => navigate('/onboarding?add=1')}>
              <PlusIcon className="h-3.5 w-3.5" aria-hidden />
              Add vehicle
            </ArcadeButton>
          } />
        
        <div className="mt-4">
          <GarageList />
        </div>
      </Panel>

      <Panel className="p-5 sm:p-6" aria-labelledby="prefs-title">
        <PanelHeader id="prefs-title" title="Preferences" subtitle="Saved to your account and applied on every device." />
        {prefError &&
        <Notice tone="error" className="mt-4">
            {prefError}
          </Notice>
        }
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <p className="cw-label">Theme</p>
            <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Theme">
              {(['dark', 'light'] as const).map((t) =>
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={theme === t}
                onClick={() => void updatePreferences({ theme: t })}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold capitalize transition-colors duration-150 ease-out ${
                theme === t ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted hover:text-ink'}`
                }>
                
                  {t === 'dark' ? <MoonIcon className="h-4 w-4" aria-hidden /> : <SunIcon className="h-4 w-4" aria-hidden />}
                  {t}
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="cw-label">Default charging priority</p>
            <div className="mt-2">
              <SegmentedControl<ModeKey>
                size="sm"
                ariaLabel="Default charging priority"
                value={preferences?.priority_mode ?? 'balanced'}
                onChange={(m) => void updatePreferences({ priority_mode: m })}
                options={(Object.keys(MODES) as ModeKey[]).map((k) => ({ value: k, label: MODES[k].label }))} />
              
            </div>
          </div>
          <div>
            <RangeSlider
              id="defReserve"
              label="Default battery reserve"
              value={reserve}
              min={0}
              max={40}
              display={`${reserve}%`}
              hint="Used when no vehicle reserve is set. Vehicle reserves take priority."
              onChange={(v) => setReserve(Math.round(v))} />
            
            <ArcadeButton variant="ghost" size="sm" className="mt-2" disabled={reserve === preferences?.default_reserve} onClick={() => void updatePreferences({ default_reserve: reserve })}>
              Save reserve
            </ArcadeButton>
          </div>
          <div>
            <p className="cw-label">Sound effects</p>
            <label className="mt-2 flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--cw-accent))]" checked={soundOn} onChange={(e) => void updatePreferences({ sound_on: e.target.checked })} />
              Play short arcade sounds
            </label>
            <p className="mt-1 text-xs text-muted">Off by default. The speaker button in the top bar mutes instantly.</p>
          </div>
        </div>
      </Panel>

      <Panel tone="danger" className="p-5 sm:p-6" aria-labelledby="danger-title">
        <h2 id="danger-title" className="font-pixel text-[11px] uppercase text-danger">
          Delete account
        </h2>
        <p className="mt-2 text-sm text-muted">Permanently deletes your account, vehicles, preferences, saved stations and journey history. This can’t be undone.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="confirmDelete" className="cw-label">
              Type DELETE to confirm
            </label>
            <input id="confirmDelete" className="cw-input mt-1.5 w-48 font-mono" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          </div>
          <ArcadeButton variant="danger" disabled={confirmText !== 'DELETE' || deleting} onClick={remove}>
            <Trash2Icon className="h-4 w-4" aria-hidden />
            {deleting ? 'Deleting…' : 'Delete account'}
          </ArcadeButton>
        </div>
        {deleteError &&
        <Notice tone="error" role="alert" className="mt-4">
            {deleteError}
          </Notice>
        }
      </Panel>
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <StarIcon className="h-3.5 w-3.5" aria-hidden />
        XP and badges are stored on this device.
      </p>
    </div>);

}