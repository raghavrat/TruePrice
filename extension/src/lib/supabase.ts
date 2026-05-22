import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Service workers have no localStorage (Supabase's default). Back auth with
// chrome.storage.local so the session is shared across the service worker,
// popup, and options page — and so the client never touches localStorage.
const chromeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const res = await chrome.storage.local.get(key);
    return (res[key] as string | undefined) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [key]: value });
  },
  removeItem: async (key: string): Promise<void> => {
    await chrome.storage.local.remove(key);
  },
};

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: chromeStorage,
        persistSession: true,
        autoRefreshToken: true,
        // No OAuth redirect URL to parse inside an extension context.
        detectSessionInUrl: false,
      },
    })
  : null;
