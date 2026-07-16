import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for use in browser (Client Components).
 * Uses the public anon key — protected by RLS policies.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
