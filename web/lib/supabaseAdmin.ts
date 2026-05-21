import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
// New-format secret key (sb_secret_...); replaces the legacy service_role JWT.
// Bypasses RLS, so it must stay server-only.
const secretKey = process.env.SUPABASE_SECRET_KEY;

/** Server-only admin client for the global domain_profiles cache. Null if unconfigured. */
export const supabaseAdmin: SupabaseClient | null =
  url && secretKey
    ? createClient(url, secretKey, { auth: { persistSession: false } })
    : null;
