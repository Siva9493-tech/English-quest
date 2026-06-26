import { createClient } from '@supabase/supabase-js'

// Single shared Supabase client for the whole app.
// Credentials come from Vite env vars (see .env / .env.example).
//
// Guard: only create a real client when the URL looks like a genuine Supabase
// project URL. Otherwise export `null` so callers can gracefully fall back to
// localStorage instead of crashing on a bad/placeholder URL.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const isConfigured = url?.includes('supabase.co') && !!key

export const supabase = isConfigured
  ? createClient(url, key)
  : null // graceful fallback — app runs offline against localStorage

export const isSupabaseReady = isConfigured
