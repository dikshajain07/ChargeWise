import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* Supabase connection.
   Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or paste the project URL
   and the anon (public) key below. NEVER put the service-role key in frontend code —
   all access is protected by the Row Level Security policies in docs/supabase-setup.md. */
const FALLBACK_URL = '';
const FALLBACK_ANON_KEY = '';

function readEnv(key: string): string {
  try {
    const env = (import.meta as unknown as {env?: Record<string, string | undefined>;}).env;
    return env?.[key] ?? '';
  } catch {
    return '';
  }
}

const url = readEnv('VITE_SUPABASE_URL') || FALLBACK_URL;
const anonKey = readEnv('VITE_SUPABASE_ANON_KEY') || FALLBACK_ANON_KEY;

/* "Remember me": persist the session in localStorage, otherwise only for this tab. */
const REMEMBER_KEY = 'cw-remember-session';

export function setRememberSession(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  } catch {

    /* storage unavailable */}
}

function shouldRemember(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== '0';
  } catch {
    return true;
  }
}

const authStorage = {
  getItem: (k: string) => localStorage.getItem(k) ?? sessionStorage.getItem(k),
  setItem: (k: string, v: string) => {
    if (shouldRemember()) {
      localStorage.setItem(k, v);
      sessionStorage.removeItem(k);
    } else {
      sessionStorage.setItem(k, v);
      localStorage.removeItem(k);
    }
  },
  removeItem: (k: string) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  }
};

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured ?
createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: authStorage }
}) :
null;