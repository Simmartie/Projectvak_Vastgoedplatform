import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for API routes and server components.
 * Does not use cookies - for data fetching with anon key.
 */
export function createServerAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}
