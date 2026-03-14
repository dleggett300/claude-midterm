import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only initialise the client when real credentials are present.
// This lets the app load and show the login page even before .env is configured.
export const supabase = url?.startsWith('http') && key
  ? createClient(url, key)
  : null
