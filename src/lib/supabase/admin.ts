// ⚠️ IMPORTANT: This file must ONLY be imported in Node.js runtime contexts.
// Never import this in Edge middleware or client components.
// Only use in: Route Handlers with `export const runtime = 'nodejs'`,
//              Server Actions, or scripts.

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Creates an admin Supabase client that bypasses RLS.
 * Use only for admin operations (user management, seed scripts, etc.).
 * NEVER expose to the client or use in Edge runtime.
 */
export function createAdminClient() {
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Add it to .env.local from Supabase Dashboard → Settings → API.'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
