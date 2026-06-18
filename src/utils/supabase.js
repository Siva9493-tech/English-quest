import { createClient } from '@supabase/supabase-js'

// Single shared Supabase client for the whole app.
// Credentials come from Vite env vars (see .env / .env.example).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
