import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, setRememberSession, supabase } from '../utils/supabase';
import type { Profile } from '../types/user';

interface Result {
  error?: string;
}

interface AuthValue {
  configured: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  recovery: boolean;
  signUp: (name: string, email: string, password: string) => Promise<Result & {needsConfirmation?: boolean;}>;
  signIn: (email: string, password: string, remember: boolean) => Promise<Result>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<Result>;
  updatePassword: (password: string) => Promise<Result>;
  updateProfile: (patch: Partial<Pick<Profile, 'full_name' | 'onboarding_done'>>) => Promise<Result>;
  deleteAccount: () => Promise<Result>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);
const NOT_CONFIGURED = 'Accounts aren’t configured yet. Connect a Supabase project to enable sign-in.';

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState(false);

  const loadProfile = useCallback(async (uid: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('profiles').select('id, full_name, onboarding_done, created_at').eq('id', uid).maybeSingle();
    if (error) {
      setProfileError(error.message);
      setProfile(null);
      return;
    }
    setProfileError(null);
    setProfile(data as Profile | null ?? null);
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    client.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      if (active) setLoading(false);
    });
    const { data: sub } = client.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      // Defer Supabase calls out of the auth callback to avoid lock contention.
      setTimeout(() => {
        if (s) void loadProfile(s.user.id);else
        setProfile(null);
      }, 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/welcome` }
    });
    if (error) return { error: error.message };
    return { needsConfirmation: !data.session };
  }, []);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    setRememberSession(remember);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) await loadProfile(data.user.id);
    return {};
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setRecovery(false);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    return error ? { error: error.message } : {};
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    setRecovery(false);
    return {};
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Pick<Profile, 'full_name' | 'onboarding_done'>>) => {
    const uid = session?.user.id;
    if (!supabase || !uid) return { error: NOT_CONFIGURED };
    const { error } = await supabase.from('profiles').update(patch).eq('id', uid);
    if (error) return { error: error.message };
    setProfile((p) => p ? { ...p, ...patch } : p);
    return {};
  }, [session?.user.id]);

  const deleteAccount = useCallback(async () => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.rpc('delete_own_account');
    if (error) return { error: error.message };
    await supabase.auth.signOut();
    setProfile(null);
    return {};
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) await loadProfile(session.user.id);
  }, [session?.user.id, loadProfile]);

  const value = useMemo<AuthValue>(
    () => ({
      configured: isSupabaseConfigured,
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileError,
      recovery,
      signUp,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
      updateProfile,
      deleteAccount,
      refreshProfile
    }),
    [session, profile, loading, profileError, recovery, signUp, signIn, signOut, requestPasswordReset, updatePassword, updateProfile, deleteAccount, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function displayName(profile: Profile | null, user: User | null): string {
  const meta = user?.user_metadata as {full_name?: string;} | undefined;
  return profile?.full_name?.trim() || meta?.full_name?.trim() || user?.email?.split('@')[0] || 'Driver';
}