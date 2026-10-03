import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const getSupabaseCredentials = () => {
  const metaEnv = (import.meta as any)?.env || {};
  const url = (
    typeof window !== 'undefined'
      ? (localStorage.getItem('cbt_supabase_url') || metaEnv.VITE_SUPABASE_URL || '')
      : (metaEnv.VITE_SUPABASE_URL || '')
  ).trim();

  const key = (
    typeof window !== 'undefined'
      ? (localStorage.getItem('cbt_supabase_key') || metaEnv.VITE_SUPABASE_ANON_KEY || '')
      : (metaEnv.VITE_SUPABASE_ANON_KEY || '')
  ).trim();

  return { url, key };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url &&
      url.startsWith('http') &&
      !url.includes('your-project.supabase.co') &&
      key &&
      key.length > 20 &&
      key !== 'your-anon-key-here'
  );
};

let cachedInstanceUrl = '';
let cachedInstanceKey = '';
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  if (!supabaseInstance || cachedInstanceUrl !== url || cachedInstanceKey !== key) {
    cachedInstanceUrl = url;
    cachedInstanceKey = key;
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
};

