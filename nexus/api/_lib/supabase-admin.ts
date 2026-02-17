import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase: SupabaseClient | null =
  supabaseServiceKey && supabaseUrl
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'nexus.agii@gmail.com').trim()

export function isAdmin(headers: Record<string, string | string[] | undefined>): boolean {
  const email = ((headers['x-clerk-user-email'] as string) || '').trim()
  if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true

  // Dev mode bypass
  if (process.env.NODE_ENV !== 'production') {
    const clerkId = headers['x-clerk-user-id'] as string
    if (!clerkId || clerkId === 'dev-user-local') return true
  }

  return false
}
