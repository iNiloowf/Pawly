import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function isSecretKey(key: string): boolean {
  return key.startsWith('sb_secret_') || key.includes('service_role')
}

export const supabaseKeyError: string | null =
  anonKey && isSecretKey(anonKey)
    ? 'Wrong API key: use the Publishable key (sb_publishable_...), not the Secret key.'
    : null

export const isSupabaseConfigured = Boolean(url && anonKey && !supabaseKeyError)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null
